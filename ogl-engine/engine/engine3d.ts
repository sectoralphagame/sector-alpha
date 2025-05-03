import type { Transform } from "ogl";
import { Post, Texture, Vec2, Vec3, RenderTarget } from "ogl";
import settings from "@core/settings";
import { EntityMesh } from "@ui/components/TacticalMap/EntityMesh";
import { gameStore } from "@ui/state/game";
import brightPassFragment from "../post/brightPass.frag.glsl";
import blurFragment from "../post/blur.frag.glsl";
import fxaaFragment from "../post/fxaa.frag.glsl";
import vignetteFragment from "../post/vignette.frag.glsl";
import godraysFragment from "../post/godrays.frag.glsl";
import compositeFragment from "../post/composite.frag.glsl";
import type { Light } from "./Light";
import { dummyLight } from "./Light";
import { Camera } from "./Camera";
import { Engine } from "./engine";
import { TacticalMapScene, type Scene } from "./Scene";
import { Star } from "../builders/Star";

const bloomSize = 1.2;
const lightsNum = 16;

const tempVec3 = new Vec3();

export class Engine3D<TScene extends Scene = Scene> extends Engine<TScene> {
  canvas: HTMLCanvasElement;
  postProcessing = false;
  fxaa = false;
  godrays = false;
  scene: TScene;
  /**
   * Capture performance metrics for the next frame
   */
  willCapturePerformance = false;
  capturePerformance = false;
  performanceReport: Array<{
    id: number;
    time: number;
    label: string;
    parent: number;
  }> = [];

  fxOwners: Record<number, Transform[]> = {};

  uniforms: {
    env: {
      ambient: { value: Vec3 };
      lights: Light["uniforms"][];
      tEnvMap: { value: Texture };
      postProcessing: {
        godrays: {
          uDensity: { value: number };
          uWeight: { value: number };
          uDecay: { value: number };
          uExposure: { value: number };
        };
        bloom: {
          uBloomStrength: { value: number };
        };
        vignette: {
          uStrength: { value: number };
          uSmoothness: { value: number };
          uOffset: { value: number };
        };
      };
    };
    resolution: { base: { value: Vec2 }; bloom: { value: Vec2 } };
    uTime: { value: number };
    uSeed: { value: number };
  };

  private lights: Light[] = [];
  private postProcessingLayers: Record<"composite" | "bloom", Post>;
  private renderTarget: RenderTarget;

  constructor() {
    super();
    this.initUniforms();
  }

  init = (canvas: HTMLCanvasElement) => {
    super.init(canvas);

    const gl = this.renderer.gl;
    this.camera = new Camera(this);
    this.camera.position.set(50, 50, 50);
    this.camera.lookAt([0, 0, 0]);
    this.camera.near = settings.camera.near;
    this.camera.far = settings.camera.far;

    this.renderTarget = new RenderTarget(gl, {
      color: 2,
      width: gl.canvas.width * this.dpr,
      height: gl.canvas.height * this.dpr,
    });

    this.uniforms.env.tEnvMap.value = new Texture(this.renderer.gl);

    this.initPostProcessing();
    window.renderer = this;
    this.hooks.onInit.notify();
    this.initialized = true;
  };

  private initUniforms() {
    this.uniforms = {
      env: {
        ambient: { value: new Vec3(0) },
        lights: [],
        tEnvMap: { value: null! },
        postProcessing: {
          godrays: {
            uDensity: { value: 0.8 },
            uWeight: { value: 1 },
            uDecay: { value: 0.86 },
            uExposure: { value: 0.9 },
          },
          bloom: {
            uBloomStrength: { value: 1.1 },
          },
          vignette: {
            uStrength: { value: 0.38 },
            uSmoothness: { value: 0.19 },
            uOffset: { value: -0.41 },
          },
        },
      },
      resolution: {
        base: { value: new Vec2() },
        bloom: { value: new Vec2() },
      },
      uTime: { value: 0 },
      uSeed: { value: Math.random() },
    };
  }

  private initPostProcessing = () => {
    const gl = this.renderer.gl;

    this.postProcessingLayers = {
      composite: new Post(gl),
      bloom: new Post(gl, {
        dpr: this.dpr / 4,
        targetOnly: true,
        depth: false,
      }),
    };

    this.postProcessingLayers.bloom.addPass({
      fragment: brightPassFragment,
      uniforms: {
        uThreshold: { value: 0.95 },
        tEmissive: { value: new Texture(gl) },
      },
    });

    const horizontalPass = this.postProcessingLayers.bloom.addPass({
      fragment: blurFragment,
      uniforms: {
        uResolution: this.uniforms.resolution.bloom,
        uDirection: { value: new Vec2(bloomSize * 3, 0) },
      },
    });
    const verticalPass = this.postProcessingLayers.bloom.addPass({
      fragment: blurFragment,
      uniforms: {
        uResolution: this.uniforms.resolution.bloom,
        uDirection: { value: new Vec2(0, bloomSize) },
      },
    });
    for (let i = 0; i < 16; i++) {
      this.postProcessingLayers.bloom.passes.push(horizontalPass, verticalPass);
    }

    this.postProcessingLayers.composite.addPass({
      fragment: compositeFragment,
      uniforms: {
        uResolution: this.uniforms.resolution.base,
        tBloom: this.postProcessingLayers.bloom.uniform,
        uBloomStrength: this.uniforms.env.postProcessing.bloom.uBloomStrength,
      },
    });
    this.postProcessingLayers.composite.addPass({
      fragment: godraysFragment,
      uniforms: {
        tBloom: this.postProcessingLayers.bloom.uniform,
        uSunPos: { value: new Vec2() },
        uDensity: this.uniforms.env.postProcessing.godrays.uDensity,
        uWeight: this.uniforms.env.postProcessing.godrays.uWeight,
        uDecay: this.uniforms.env.postProcessing.godrays.uDecay,
        uExposure: this.uniforms.env.postProcessing.godrays.uExposure,
      },
    });
    this.postProcessingLayers.composite.addPass({
      fragment: fxaaFragment,
      uniforms: {
        uResolution: this.uniforms.resolution.base,
      },
    });
    this.postProcessingLayers.composite.addPass({
      fragment: vignetteFragment,
      uniforms: {
        uResolution: this.uniforms.resolution.base,
        uStrength: this.uniforms.env.postProcessing.vignette.uStrength,
        uSmoothness: this.uniforms.env.postProcessing.vignette.uSmoothness,
        uOffset: this.uniforms.env.postProcessing.vignette.uOffset,
      },
    });
  };

  private get vignettePass() {
    return this.postProcessingLayers.composite.passes.at(-1)!;
  }

  private get fxaaPass() {
    return this.postProcessingLayers.composite.passes.at(-2)!;
  }

  private get godraysPass() {
    return this.postProcessingLayers.composite.passes.at(-3)!;
  }

  private get compositePass() {
    return this.postProcessingLayers.composite.passes.at(-4)!;
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
    if (this.willCapturePerformance) {
      this.capturePerformance = true;
      this.willCapturePerformance = false;
    }

    this.prepareLighting();

    if (this.postProcessing) {
      this.renderComposite();
    } else {
      this.renderSimple();
    }

    this.capturePerformance = false;
  }

  private renderSimple = () => {
    this.renderer.render({
      scene: this.scene,
      camera: this.camera,
    });
  };

  private renderComposite = () => {
    this.godraysPass.uniforms.uSunPos.value.set(0.5, 0.5);

    this.scene.traverse((m) => {
      if (m instanceof Star) {
        const v = m.position
          .clone()
          .applyMatrix4(this.camera.projectionViewMatrix);
        this.godraysPass.uniforms.uSunPos.value.set(
          v.x / 2 + 0.5,
          v.y / 2 + 0.5
        );
      }
    });

    // Disable compositePass pass, so this post will just render the scene for now
    this.compositePass.enabled = false;
    this.godraysPass.enabled = false;
    this.fxaaPass.enabled = false;
    this.vignettePass.enabled = false;
    // `targetOnly` prevents post from rendering to the canvas
    this.postProcessingLayers.composite.targetOnly = true;
    // This renders the scene to postComposite.uniform.value
    this.postProcessingLayers.composite.render({
      scene: this.scene,
      camera: this.camera,
      target: this.renderTarget,
    });

    // This render the bloom effect's bright and blur passes to postBloom.fbo.read
    // Passing in a `texture` argument avoids the post initially rendering the scene
    for (const pass of this.postProcessingLayers.bloom.passes) {
      if (pass.uniforms.tEmissive !== undefined) {
        pass.uniforms.tEmissive.value = this.renderTarget.textures[1];
      }
    }
    this.postProcessingLayers.bloom.render({
      texture: this.renderTarget.textures[0],
    });
    // Re-enable composite pass
    this.compositePass.enabled = true;
    this.godraysPass.enabled = this.godrays;
    this.fxaaPass.enabled = this.fxaa;
    this.vignettePass.enabled = true;
    // Allow post to render to canvas upon its last pass
    this.postProcessingLayers.composite.targetOnly = false;

    // This renders to canvas, compositing the bloom pass on top
    // pass back in its previous render of the scene to avoid re-rendering
    this.postProcessingLayers.composite.render({
      texture: this.renderTarget.textures[0],
    });
  };

  resize = () => {
    super.resize();

    const w = this.canvas!.parentElement!.clientWidth;
    const h = this.canvas!.parentElement!.clientHeight;

    // Update post classes
    this.postProcessingLayers.composite.resize({
      width: w,
      height: h,
      dpr: this.dpr,
    });
    this.postProcessingLayers.bloom.resize({
      width: w,
      height: h,
      dpr: this.dpr / 4,
    });
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

  override setScene(scene: TScene) {
    if (this.scene instanceof TacticalMapScene) {
      this.scene.destroy();
    }
    this.fxOwners = {};

    super.setScene(scene);
  }

  capture() {
    this.willCapturePerformance = true;
    this.capturePerformance = false;
  }
}
