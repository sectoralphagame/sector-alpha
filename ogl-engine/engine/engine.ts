import { Renderer } from "ogl";
import { PubSub } from "@core/utils/pubsub";
import type { Scene } from "./Scene";
import type { Camera } from "./Camera";

type InitEvent = { type: "init" };
type UpdateEvent = { type: "update"; delta: number };
type ErrorEvent = { type: "error"; error: Error };
type EngineEvent = InitEvent | UpdateEvent | ErrorEvent;

export type RenderingContext = WebGL2RenderingContext & {
  renderer: Renderer;
  canvas: HTMLCanvasElement;
};

export abstract class Engine<TScene extends Scene = Scene> {
  public hooks: PubSub<EngineEvent>;

  public camera: Camera;
  protected canvas: HTMLCanvasElement | OffscreenCanvas;
  public initialized = false;
  public scene: TScene;

  protected renderer: Renderer;
  protected dpr = window.devicePixelRatio;
  protected lastFrameTime: number;

  public originalDelta = 0;
  protected deltaMultiplier = 1;

  constructor() {
    this.hooks = new PubSub();
    this.lastFrameTime = performance.now();
  }

  abstract isFocused(): boolean;

  init(canvas: HTMLCanvasElement | OffscreenCanvas): void {
    if (this.initialized) {
      throw new Error("Engine already initialized");
    }

    this.canvas = canvas;
    this.renderer = new Renderer({
      canvas: canvas as any, // Works for both HTMLCanvasElement and OffscreenCanvas
      dpr: this.dpr,
      antialias: true,
      webgl: 2,
    });
  }

  resize(): void {
    if (!this.canvas || this.canvas instanceof OffscreenCanvas) return;

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
    this.originalDelta = (now - this.lastFrameTime) / 1000;
    this.hooks.publish({ type: "update", delta: this.delta });

    try {
      if (this.isFocused()) {
        this.render();
      }
    } catch (err) {
      this.hooks.publish({ type: "error", error: err });
      throw err;
    }

    this.lastFrameTime = now;
  }

  abstract render(): void;

  setScene(scene: TScene) {
    this.scene = scene;
  }

  setDeltaMultiplier(value: number) {
    this.deltaMultiplier = value;
  }

  get gl() {
    return this.renderer.gl as RenderingContext;
  }

  get delta() {
    return this.originalDelta * this.deltaMultiplier;
  }
}
