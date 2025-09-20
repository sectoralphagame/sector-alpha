import type {
  OGLRenderingContext,
  Pass,
  RenderTargetOptions,
  Transform,
} from "ogl";
import { Post, Texture, Vec2, Vec3, RenderTarget } from "ogl";
import settings from "@core/settings";
import { EntityMesh } from "@ui/components/TacticalMap/EntityMesh";
import { gameStore } from "@ui/state/game";
import { sortBy } from "@fxts/core";
import { getPane } from "@ui/context/Pane";
import brightPassFragment from "../post/brightPass.frag.glsl";
import fxaaFragment from "../post/fxaa.frag.glsl";
import vignetteFragment from "../post/vignette.frag.glsl";
import uiFragment from "../post/ui.frag.glsl";
import godraysFragment from "../post/godrays.frag.glsl";
import tonemappingFragment from "../post/tonemapping.frag.glsl";
import compositeFragment from "../post/composite.frag.glsl";
import type { Light } from "./Light";
import { dummyLight } from "./Light";
import { Camera } from "./Camera";
import { Engine } from "./engine";
import { TacticalMapScene, type Scene } from "./Scene";
import { OnBeforeRenderTask } from "./task";
import { RenderingPerformance } from "./performance";
import { createEngine3DUniforms, type Engine3DUniforms } from "./uniforms3d";
import { DualKawasePost } from "./post/dualKawase";

const lightsNum = 16;

const tempVec3 = new Vec3();

function createHiDefRenderTarget(
  gl: OGLRenderingContext,
  opts: Partial<RenderTargetOptions> = {}
) {
  return new RenderTarget(gl, {
    // @ts-expect-error type resolution fails for some reason
    type: gl.HALF_FLOAT,
    format: gl.RGBA,
    // @ts-expect-error type resolution fails for some reason
    internalFormat: gl.RGBA16F,
    minFilter: gl.LINEAR,
    magFilter: gl.LINEAR,
    ...opts,
  });
}

export class Engine3D<TScene extends Scene = Scene> extends Engine<TScene> {
  canvas: HTMLCanvasElement;
  postProcessing = true;
  fxaa = false;
  godrays = false;
  scene: TScene;
  performance = new RenderingPerformance();

  fxOwners: Record<number, Transform[]> = {};

  uniforms: Engine3DUniforms;
  kawase = new DualKawasePost();

  private lights: Light[] = [];
  private postProcessingLayers: Record<
    "composite" | "bloom",
    {
      post: Post;
      passes: Record<
        string,
        {
          pass: Pass;
          enabled: boolean;
        }
      >;
    }
  >;
  private renderTarget: RenderTarget;
  private onBeforeRenderTasks: OnBeforeRenderTask[] = [];

  constructor() {
    super();
    this.uniforms = createEngine3DUniforms();
    this.initPane();
  }

  init = (canvas: HTMLCanvasElement) => {
    super.init(canvas);

    this.gl.getExtension("EXT_color_buffer_float");
    this.gl.getExtension("WEBGL_color_buffer_float");
    this.gl.getExtension("OES_texture_half_float");
    this.gl.getExtension("OES_texture_half_float_linear");

    const gl = this.renderer.gl;
    this.camera = new Camera(this);
    this.camera.position.set(50, 50, 50);
    this.camera.lookAt([0, 0, 0]);
    this.camera.near = settings.camera.near;
    this.camera.far = settings.camera.far;

    this.renderTarget = createHiDefRenderTarget(gl, { color: 3 });

    this.uniforms.env.tEnvMap.value = new Texture(this.renderer.gl);

    this.initPostProcessing();
    window.renderer = this;
    this.hooks.publish({ type: "init" });
    this.initialized = true;
  };

  initPane() {
    const folder = getPane().addOrReplaceFolder({
      title: "Renderer",
      expanded: true,
    });
    folder.addBinding(this.performance, "fps", {
      readonly: true,
      interval: 500,
      label: "FPS",
    });
    folder.addBinding(this.performance, "fps", {
      view: "graph",
      label: "FPS Graph",
      interval: 500,
      readonly: true,
    });
    folder.addBinding(this.performance, "averageFrameTime", {
      view: "graph",
      label: "Avg Frame Time [ms]",
      interval: 500,
      readonly: true,
      min: 0,
      max: 4,
    });
    folder.addBinding(this.uniforms.uTime, "value", {
      readonly: true,
    });
    folder
      .addButton({
        title: "Toggle Ticker",
      })
      .on("click", () => {
        this.setDeltaMultiplier(this.deltaMultiplier === 1 ? 0 : 1);
      });
  }

  private initPostProcessing = () => {
    const gl = this.renderer.gl;

    this.postProcessingLayers = {
      composite: {
        post: new Post(gl, {
          dpr: this.dpr,
        }),
        passes: {},
      },
      bloom: {
        post: new Post(gl, {
          dpr: this.dpr,
          targetOnly: true,
          depth: false,
        }),
        passes: {},
      },
    };

    this.kawase.init(this.postProcessingLayers.bloom.post);

    this.postProcessingLayers.composite.post.fbo.read = createHiDefRenderTarget(
      gl,
      { depth: false }
    );
    this.postProcessingLayers.composite.post.fbo.write =
      createHiDefRenderTarget(gl, { depth: false });

    this.postProcessingLayers.bloom.post.fbo.read = createHiDefRenderTarget(
      gl,
      { depth: false }
    );
    this.postProcessingLayers.bloom.post.fbo.write = createHiDefRenderTarget(
      gl,
      { depth: false }
    );

    this.postProcessingLayers.composite.post.resize();
    this.postProcessingLayers.bloom.post.resize();

    this.postProcessingLayers.bloom.passes.bright = {
      pass: this.postProcessingLayers.bloom.post.addPass({
        fragment: brightPassFragment,
        uniforms: {
          uThreshold: { value: 0.995 },
          tEmissive: { value: null },
        },
      }),
      enabled: true,
    };

    this.postProcessingLayers.composite.passes.composite = {
      enabled: true,
      pass: this.postProcessingLayers.composite.post.addPass({
        fragment: compositeFragment,
        uniforms: {
          tBloom: this.postProcessingLayers.bloom.post.uniform,
          uBloomStrength: this.uniforms.env.postProcessing.bloom.uGain,
        },
      }),
    };
    this.postProcessingLayers.composite.passes.godrays = {
      // FIXME: Needs refinement
      enabled: false,
      pass: this.postProcessingLayers.composite.post.addPass({
        fragment: godraysFragment,
        uniforms: {
          tBloom: this.postProcessingLayers.bloom.passes.uniform,
          uSunPos: { value: new Vec2() },
          uDensity: this.uniforms.env.postProcessing.godrays.uDensity,
          uWeight: this.uniforms.env.postProcessing.godrays.uWeight,
          uDecay: this.uniforms.env.postProcessing.godrays.uDecay,
          uExposure: this.uniforms.env.postProcessing.godrays.uExposure,
        },
      }),
    };
    this.postProcessingLayers.composite.passes.tonemapping = {
      enabled: true,
      pass: this.postProcessingLayers.composite.post.addPass({
        fragment: tonemappingFragment,
        uniforms: {
          ...this.uniforms.env.postProcessing.tonemapping,
          uTime: this.uniforms.uTime,
        },
      }),
    };
    this.postProcessingLayers.composite.passes.fxaa = {
      enabled: true,
      pass: this.postProcessingLayers.composite.post.addPass({
        fragment: fxaaFragment,
        uniforms: {
          uResolution: this.uniforms.resolution.base,
        },
      }),
    };
    this.postProcessingLayers.composite.passes.vignette = {
      enabled: true,
      pass: this.postProcessingLayers.composite.post.addPass({
        fragment: vignetteFragment,
        uniforms: {
          uResolution: this.uniforms.resolution.base,
          uStrength: this.uniforms.env.postProcessing.vignette.uStrength,
          uSmoothness: this.uniforms.env.postProcessing.vignette.uSmoothness,
          uOffset: this.uniforms.env.postProcessing.vignette.uOffset,
        },
      }),
    };
    this.postProcessingLayers.composite.passes.ui = {
      enabled: true,
      pass: this.postProcessingLayers.composite.post.addPass({
        fragment: uiFragment,
        uniforms: {
          tUi: this.renderTarget.textures[2],
        },
      }),
    };
  };

  private get vignettePass() {
    return this.postProcessingLayers.composite.passes.vignette;
  }

  private get fxaaPass() {
    return this.postProcessingLayers.composite.passes.fxaa;
  }

  private get godraysPass() {
    return this.postProcessingLayers.composite.passes.godrays;
  }

  private get compositePass() {
    return this.postProcessingLayers.composite.passes.composite;
  }

  // eslint-disable-next-line class-methods-use-this
  override isFocused(): boolean {
    return gameStore.overlay === null;
  }

  update(): void {
    super.update();
    this.uniforms.uTime.value += this.delta;
  }

  render() {
    this.performance.updateTimeToNextFrame();
    const startTime = performance.now();
    this.prepareLighting();

    if (this.postProcessing) {
      this.renderComposite();
    } else {
      this.renderSimple();
    }
    this.performance.updateFrameTime(performance.now() - startTime);

    if (this.deltaMultiplier > 0) {
      this.executeOnBeforeRenderTasks();
    }
  }

  private renderSimple = () => {
    this.renderer.render({
      scene: this.scene,
      camera: this.camera,
    });
  };

  private renderComposite() {
    // Disable compositePass pass, so this post will just render the scene for now
    for (const pass of this.postProcessingLayers.composite.post.passes) {
      pass.enabled = false;
    }
    // `targetOnly` prevents post from rendering to the canvas
    this.postProcessingLayers.composite.post.targetOnly = true;
    // This renders the scene to postComposite.uniform.value
    this.postProcessingLayers.composite.post.render({
      scene: this.scene,
      camera: this.camera,
      target: this.renderTarget,
    });

    // This render the bloom effect's bright and blur passes to postBloom.fbo.read
    // Passing in a `texture` argument avoids the post initially rendering the scene
    for (const pass of this.postProcessingLayers.bloom.post.passes) {
      if (pass.uniforms.tEmissive !== undefined) {
        pass.uniforms.tEmissive.value = this.renderTarget.textures[1];
      }
    }
    this.postProcessingLayers.composite.passes.ui.pass.uniforms.tUi.value =
      this.renderTarget.textures[2];
    this.postProcessingLayers.bloom.post.render({
      texture: this.renderTarget.textures[0],
    });
    this.kawase.render(this.postProcessingLayers.bloom.post);

    // Re-enable composite pass
    this.compositePass.pass.enabled = true;
    this.postProcessingLayers.composite.passes.tonemapping.pass.enabled =
      this.postProcessingLayers.composite.passes.tonemapping.enabled;
    this.godraysPass.pass.enabled = this.godraysPass.enabled;
    this.fxaaPass.pass.enabled = this.fxaa;
    this.vignettePass.pass.enabled =
      this.postProcessingLayers.composite.passes.vignette.enabled;
    this.postProcessingLayers.composite.passes.ui.pass.enabled =
      this.postProcessingLayers.composite.passes.ui.enabled;
    // Allow post to render to canvas upon its last pass
    this.postProcessingLayers.composite.post.targetOnly = false;

    // This renders to canvas, compositing the bloom pass on top
    // pass back in its previous render of the scene to avoid re-rendering
    this.postProcessingLayers.composite.post.render({
      texture: this.renderTarget.textures[0],
    });
  }

  resize = () => {
    super.resize();

    const w = this.canvas!.parentElement!.clientWidth;
    const h = this.canvas!.parentElement!.clientHeight;

    // Update post classes
    this.postProcessingLayers.composite.post.resize();
    this.postProcessingLayers.bloom.post.resize();
    this.renderTarget.setSize(w * this.dpr, h * this.dpr);

    // Update uniforms
    this.uniforms.resolution.base.value.set(w, h);
    this.uniforms.resolution.bloom.value.set(w, h);
  };

  addLight = (light: Light) => {
    this.lights.push(light);
  };

  removeLight = (light: Light) => {
    const index = this.lights.indexOf(light);
    if (index === -1) {
      throw new Error("Light not found");
    }

    this.lights.splice(index, 1);
  };

  clearLights() {
    this.lights = [];
    this.uniforms.env.lights = [];
  }

  getByEntityId(id: number): EntityMesh | null {
    let mesh: EntityMesh | null = null;

    this.scene.traverse((m) => {
      if (m instanceof EntityMesh && m.entityId === id) {
        mesh = m;
        return true;
      }

      return false;
    });

    return mesh;
  }

  private prepareLighting() {
    const lightsToRender: Light[] = [];
    const point: Light[] = [];

    for (let i = 0; i < this.lights.length; i++) {
      this.lights[i].updateMatrixWorld();

      if (!this.lights[i].visible) continue;

      if (this.lights[i].isDirectional()) {
        lightsToRender.push(this.lights[i]);
      } else {
        point.push(this.lights[i]);
        this.lights[i].worldMatrix.getTranslation(tempVec3);
        tempVec3.applyMatrix4(this.camera.projectionViewMatrix);
        this.lights[i].zDepth = tempVec3.z;
      }
    }

    point.sort((a, b) => a.zDepth - b.zDepth);

    lightsToRender.push(...point.slice(0, lightsNum - lightsToRender.length));
    while (lightsNum > lightsToRender.length) {
      lightsToRender.push(dummyLight);
    }

    for (let i = 0; i < lightsNum; i++) {
      this.uniforms.env.lights[i] = lightsToRender[i].uniforms;
    }
  }

  togglePostProcessingPass(layer: "composite" | "bloom", pass: string) {
    const l = this.postProcessingLayers[layer];
    l.passes[pass].enabled = !l.passes[pass].enabled;

    return l.passes[pass].enabled;
  }

  override setScene(scene: TScene) {
    if (this.scene instanceof TacticalMapScene) {
      this.scene.destroy();
    }
    this.fxOwners = {};

    super.setScene(scene);
  }

  addOnBeforeRenderTask(task: () => void, priority?: number) {
    const t = new OnBeforeRenderTask(task, priority);
    this.onBeforeRenderTasks.push(t);
    return t;
  }

  executeOnBeforeRenderTasks() {
    this.onBeforeRenderTasks = this.onBeforeRenderTasks.filter((task) =>
      task.isValid()
    );

    for (const task of sortBy((t) => t.priority, this.onBeforeRenderTasks)) {
      if (task.isValid()) {
        task.run();
      }
    }
  }
}
