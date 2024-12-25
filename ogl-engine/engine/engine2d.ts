import { Renderer } from "ogl";
import settings from "@core/settings";
import type { Scene } from "./Scene";
import { StrategicMapScene } from "./Scene";
import { Camera } from "./Camera";
import { Engine } from "./engine";

// It's not really 2D, but it's going to be used as 2D
export class Engine2D extends Engine {
  init(canvas: HTMLCanvasElement) {
    if (this.initialized) {
      throw new Error("Engine already initialized");
    }

    this.canvas = canvas;
    this.renderer = new Renderer({
      canvas,
      dpr: this.dpr,
    });
    this.camera = new Camera(this);
    this.camera.disablePane();
    this.camera.orthographic();
    this.camera.position.set(0, 50, 0);
    this.camera.lookAt([0, 0, 0]);
    this.camera.near = settings.camera.near;
    this.camera.far = settings.camera.far;

    this.hooks.onInit.notify();
    this.initialized = true;
  }

  render = () => {
    this.renderer.render({
      scene: this.scene,
      camera: this.camera,
    });
  };

  setScene = (scene: Scene) => {
    this.scene = scene;
  };
}

export class StrategicMapEngine extends Engine2D {
  scene: StrategicMapScene;

  constructor() {
    super();

    this.scene = new StrategicMapScene(this);
  }

  setScene = (scene: StrategicMapScene) => {
    this.scene = scene;
  };
}
