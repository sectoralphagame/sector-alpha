import { notImplemented } from "../errors";
import settings from "../settings";

export class BaseSim {
  firstTick: number;
  lastTick: number;
  intervalHandle: number | null;
  timeOffset: number;
  speed = 1;

  constructor() {
    this.timeOffset = 0;
  }

  setSpeed = (value: number) => {
    this.speed = value ?? 1;
  };

  start = () => {
    if (this.intervalHandle) return;
    this.intervalHandle = setInterval(() => {
      try {
        const delta = ((Date.now() - this.lastTick) / 1000) * this.speed;
        this.next(delta);
        this.timeOffset += delta;
        this.lastTick = Date.now();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        this.pause();
      }
    }, 1e3 / settings.global.targetFps) as unknown as number;
    this.lastTick = Date.now();
  };

  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  next = (delta: number): void => {
    throw notImplemented;
  };

  pause = () => {
    clearInterval(this.intervalHandle!);
    this.intervalHandle = null;
  };

  getTime = (): number => this.timeOffset;
}
