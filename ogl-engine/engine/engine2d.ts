import { Renderer } from "ogl";
import settings from "@core/settings";
import { EntityMesh } from "@ui/components/TacticalMap/EntityMesh";
import type { Scene } from "./Scene";
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
    this.camera.orthographic();
    this.camera.position.set(50, 50, 50);
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
