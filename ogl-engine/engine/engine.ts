import { Observable } from "@core/utils/observer";
import {
  Transform,
  Camera,
  Post,
  Renderer,
  RenderTarget,
  Texture,
  Vec2,
} from "ogl";
import brightPassFragment from "../post/brightPass.frag.glsl";
import blurFragment from "../post/blur.frag.glsl";
import fxaaFragment from "../post/fxaa.frag.glsl";
import compositeFragment from "../post/composite.frag.glsl";

const bloomSize = 1.5;

export class Engine {
  camera: Camera;
  canvas: HTMLCanvasElement;
  scene: Transform;
  renderer: Renderer;
  dpr: number = 2;
  postProcessing = false;
  fxaa = false;
  initialized = false;

  uniforms: {
    resolution: { base: { value: Vec2 }; bloom: { value: Vec2 } };
    uTime: { value: number };
  };

  hooks: {
    onInit: Observable<void>;
    onUpdate: Observable<void>;
    onError: Observable<Error>;
  };

  private postProcessingLayers: Record<"composite" | "bloom", Post>;
  private renderTarget: RenderTarget;

  constructor() {
    this.hooks = {
      onInit: new Observable("onInit"),
      onUpdate: new Observable("onUpdate"),
      onError: new Observable("onError"),
    };
    this.scene = new Transform();
  }

  init = (canvas: HTMLCanvasElement) => {
    if (this.initialized) {
      throw new Error("Engine already initialized");
    }

    this.canvas = canvas;
    this.renderer = new Renderer({
      canvas,
      dpr: this.dpr,
    });
    const gl = this.renderer.gl;
    this.camera = new Camera(gl);
    this.camera.position.set(50, 50, 50);
    this.camera.lookAt([0, 0, 0]);
    this.camera.far = 1e5;

    this.renderTarget = new RenderTarget(gl, {
      color: 2,
    });

    this.initPostProcessing();
    window.renderer = this;
    this.hooks.onInit.notify();
    this.initialized = true;
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

    this.uniforms = {
      resolution: {
        base: { value: new Vec2() },
        bloom: { value: new Vec2() },
      },
      uTime: { value: 0 },
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
        uBloomStrength: { value: 2 },
      },
    });
    this.postProcessingLayers.composite.addPass({
      fragment: fxaaFragment,
      uniforms: {
        uResolution: this.uniforms.resolution.base,
      },
    });
  };

  get gl() {
    return this.renderer.gl;
  }

  get fxaaPass() {
    return this.postProcessingLayers.composite.passes.at(-1)!;
  }

  get compositePass() {
    return this.postProcessingLayers.composite.passes.at(-2)!;
  }

  update = () => {
    if (!this.initialized) {
      throw new Error("Engine not initialized");
    }

    this.hooks.onUpdate.notify();

    this.uniforms.uTime.value += 0.01;

    try {
      if (this.postProcessing) {
        this.render();
      } else {
        this.renderSimple();
      }
    } catch (err) {
      this.hooks.onError.notify(err);
      throw err;
    }
  };

  renderSimple = () => {
    this.renderer.render({
      scene: this.scene,
      camera: this.camera,
    });
  };

  render = () => {
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
    if (!this.canvas) return;

    const w = this.canvas!.parentElement!.clientWidth;
    const h = this.canvas!.parentElement!.clientHeight;

    this.renderer.setSize(w, h);
    this.camera.perspective({
      aspect: w / h,
    });

    // Update post classes
    this.postProcessingLayers.composite.resize();
    this.postProcessingLayers.bloom.resize();
    this.renderTarget.setSize(w, h);

    // Update uniforms
    this.uniforms.resolution.base.value.set(w, h);
    this.uniforms.resolution.bloom.value.set(w / 2, h / 2);
  };

  setScene = (scene: Transform) => {
    this.scene = scene;
  };
}
