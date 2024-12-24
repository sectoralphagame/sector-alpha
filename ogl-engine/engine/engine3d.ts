import {
  Transform,
  Post,
  RenderTarget,
  Texture,
  Vec2,
  Vec3,
  Sphere,
} from "ogl";
import settings from "@core/settings";
import { ColorMaterial } from "@ogl-engine/materials/color/color";
import { EntityMesh } from "@ui/components/TacticalMap/EntityMesh";
import brightPassFragment from "../post/brightPass.frag.glsl";
import blurFragment from "../post/blur.frag.glsl";
import fxaaFragment from "../post/fxaa.frag.glsl";
import compositeFragment from "../post/composite.frag.glsl";
import type { Light } from "./Light";
import { dummyLight } from "./Light";
import { BaseMesh } from "./BaseMesh";
import { Camera } from "./Camera";
import { Engine } from "./engine";

const bloomSize = 1.2;
const lightsNum = 32;

export class Engine3D extends Engine {
  postProcessing = false;
  fxaa = true;
  lightsContainer: Transform;

  uniforms: {
    env: {
      ambient: { value: Vec3 };
      lights: Light["uniforms"][];
    };
    resolution: { base: { value: Vec2 }; bloom: { value: Vec2 } };
    uTime: { value: number };
  };

  private postProcessingLayers: Record<"composite" | "bloom", Post>;
  private renderTarget: RenderTarget;

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
    });

    this.initUniforms();
    this.initLightsContainer();
    this.initPostProcessing();
    window.renderer = this;
    this.hooks.onInit.notify();
    this.initialized = true;
  };

  private initUniforms() {
    this.uniforms = {
      env: {
        ambient: { value: new Vec3(0.08) },
        lights: Array(lightsNum)
          .fill(0)
          .map(() => dummyLight.uniforms),
      },
      resolution: {
        base: { value: new Vec2() },
        bloom: { value: new Vec2() },
      },
      uTime: { value: 0 },
    };
  }

  private initLightsContainer = () => {
    this.lightsContainer = new Transform();
    this.lightsContainer.name = "Lights";
    this.scene.addChild(this.lightsContainer);
    this.lightsContainer.visible = false;

    for (let i = 0; i < lightsNum; i++) {
      const light = new BaseMesh<ColorMaterial>(this, {
        geometry: new Sphere(this.gl, { radius: 0.01 }),
      });
      light.applyMaterial(new ColorMaterial(this, new Vec3(1, 1, 1), false));
      light.material.uniforms.fEmissive.value = 1;
      light.visible = false;
      this.lightsContainer.addChild(light);
    }
  };

  private initPostProcessing = () => {
    const gl = this.renderer.gl;

    this.postProcessingLayers = {
      composite: new Post(gl),
      bloom: new Post(gl, {
        dpr: this.dpr / 2,
        targetOnly: true,
        depth: false,
      }),
    };

    this.postProcessingLayers.bloom.addPass({
      fragment: brightPassFragment,
      uniforms: {
        uThreshold: { value: 0.9 },
        tEmissive: { value: new Texture(gl) },
      },
    });

    const horizontalPass = this.postProcessingLayers.bloom.addPass({
      fragment: blurFragment,
      uniforms: {
        uResolution: this.uniforms.resolution.bloom,
        uDirection: { value: new Vec2(bloomSize, 0) },
      },
    });
    const verticalPass = this.postProcessingLayers.bloom.addPass({
      fragment: blurFragment,
      uniforms: {
        uResolution: this.uniforms.resolution.bloom,
        uDirection: { value: new Vec2(0, bloomSize) },
      },
    });
    for (let i = 0; i < 32; i++) {
      this.postProcessingLayers.bloom.passes.push(horizontalPass, verticalPass);
    }

    this.postProcessingLayers.composite.addPass({
      fragment: compositeFragment,
      uniforms: {
        uResolution: this.uniforms.resolution.base,
        tBloom: this.postProcessingLayers.bloom.uniform,
        uBloomStrength: { value: 1 },
      },
    });
    this.postProcessingLayers.composite.addPass({
      fragment: fxaaFragment,
      uniforms: {
        uResolution: this.uniforms.resolution.base,
      },
    });
  };

  private get fxaaPass() {
    return this.postProcessingLayers.composite.passes.at(-1)!;
  }

  private get compositePass() {
    return this.postProcessingLayers.composite.passes.at(-2)!;
  }

  update(): void {
    super.update();
    this.uniforms.uTime.value += this.delta;
  }

  render() {
    if (this.postProcessing) {
      this.renderComposite();
    } else {
      this.renderSimple();
    }
  }

  private renderSimple = () => {
    this.renderer.render({
      scene: this.scene,
      camera: this.camera,
    });
  };

  private renderComposite = () => {
    // Disable compositePass pass, so this post will just render the scene for now
    this.compositePass.enabled = false;
    this.fxaaPass.enabled = false;
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
    this.fxaaPass.enabled = this.fxaa;
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
    this.postProcessingLayers.composite.resize();
    this.postProcessingLayers.bloom.resize();
    this.renderTarget.setSize(w, h);

    // Update uniforms
    this.uniforms.resolution.base.value.set(w, h);
    this.uniforms.resolution.bloom.value.set(w / 2, h / 2);
  };

  addLight = (light: Light) => {
    for (let i = 0; i < this.uniforms.env.lights.length; i++) {
      if (this.uniforms.env.lights[i] === dummyLight.uniforms) {
        this.uniforms.env.lights[i] = light.uniforms;

        const lightMesh = this.lightsContainer.children[
          i
        ] as BaseMesh<ColorMaterial>;
        lightMesh.visible = true;
        lightMesh.material.setColor(
          light.uniforms.color.value.clone().multiply(255)
        );
        // @ts-ignore it ensures binding between light and lightMesh
        lightMesh.position = light.uniforms.position.value;

        return;
      }
    }

    throw new Error("No more light slots available");
  };

  removeLight = (light: Light) => {
    const index = this.uniforms.env.lights.indexOf(light.uniforms);
    if (index === -1) {
      throw new Error("Light not found");
    }

    this.uniforms.env.lights[index] = dummyLight.uniforms;
    const lightMesh = this.lightsContainer.children[
      index
    ] as BaseMesh<ColorMaterial>;
    lightMesh.visible = false;
  };

  getByEntityId(id: number) {
    let mesh: EntityMesh | null = null;

    this.scene.traverse((m) => {
      if (m instanceof EntityMesh && m.entityId === id) {
        mesh = m;
      }
    });

    return mesh;
  }
}
