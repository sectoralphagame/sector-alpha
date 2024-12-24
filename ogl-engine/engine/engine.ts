import { Observable } from "@core/utils/observer";
import { Renderer } from "ogl";
import { Scene } from "./Scene";
import type { Camera } from "./Camera";

export abstract class Engine {
  public hooks: {
    onInit: Observable<void>;
    onUpdate: Observable<number>;
    onError: Observable<Error>;
  };

  public camera: Camera;
  public canvas: HTMLCanvasElement;
  public initialized = false;
  public scene: Scene;

  protected renderer: Renderer;
  protected dpr = 2;
  protected lastFrameTime: number;

  public delta = 0;

  constructor() {
    this.hooks = {
      onInit: new Observable("onInit"),
      onUpdate: new Observable("onUpdate"),
      onError: new Observable("onError"),
    };
    this.scene = new Scene(this);
    this.lastFrameTime = performance.now();
  }

  init(canvas: HTMLCanvasElement): void {
    if (this.initialized) {
      throw new Error("Engine already initialized");
    }

    this.canvas = canvas;
    this.renderer = new Renderer({
      canvas,
      dpr: this.dpr,
    });
  }

  resize(): void {
    if (!this.canvas) return;

    const w = this.canvas!.parentElement!.clientWidth;
    const h = this.canvas!.parentElement!.clientHeight;

    this.renderer.setSize(w, h);
    this.camera.perspective({
      aspect: w / h,
    });
  }

  update(): void {
    if (!this.initialized) {
      throw new Error("Engine not initialized");
    }

    const now = performance.now();
    this.delta = (now - this.lastFrameTime) / 1000;
    this.hooks.onUpdate.notify(this.delta);

    try {
      this.render();
    } catch (err) {
      this.hooks.onError.notify(err);
      throw err;
    }

    this.lastFrameTime = now;
  }

  abstract render(): void;

  setScene(scene: Scene) {
    this.scene = scene;
  }

  get gl() {
    return this.renderer.gl;
  }
}
