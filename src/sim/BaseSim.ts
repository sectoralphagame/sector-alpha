import { notImplemented } from "../errors";
import settings from "../settings";

export class BaseSim {
  firstTick: number;
  lastTick: number;
  intervalHandle: number;
  timeOffset: number;
  outOfFocusPause: boolean;
  speed = 1;

  constructor() {
    this.timeOffset = 0;

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState !== "visible") {
        this.pause();
        this.outOfFocusPause = true;
      } else if (this.outOfFocusPause) {
        this.start();
        this.outOfFocusPause = false;
      }
    });
  }

  setSpeed = (value: number) => {
    this.speed = value ?? 1;
  };

  start = () => {
    if (this.intervalHandle) return;
    this.intervalHandle = setInterval(() => {
      const delta = ((Date.now() - this.lastTick) / 1000) * this.speed;
      this.next(delta);
      this.timeOffset += delta;
      this.lastTick = Date.now();
    }, 1e3 / settings.global.targetFps) as unknown as number;
    this.lastTick = Date.now();
  };

  next = (delta: number): void => {
    throw notImplemented;
  };

  pause = () => {
    clearInterval(this.intervalHandle);
    this.intervalHandle = null;
  };

  getTime = (): number => this.timeOffset;
}