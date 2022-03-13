import { notImplemented } from "../errors";
import settings from "../settings";

export class BaseSim {
  firstTick: number;
  lastTick: number;
  intervalHandle: number;
  timeOffset: number;
  outOfFocusPause: boolean;

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

  start = () => {
    this.intervalHandle = setInterval(() => {
      this.next((Date.now() - this.lastTick) / 1000);
      this.lastTick = Date.now();
    }, 1e3 / settings.global.targetFps) as unknown as number;
    this.firstTick = Date.now();
    this.lastTick = Date.now();
  };

  next = (delta: number): void => {
    throw notImplemented;
  };

  pause = () => {
    clearInterval(this.intervalHandle);
    this.intervalHandle = null;
    this.timeOffset += this.lastTick - this.firstTick;
  };

  getTime = (): number => {
    if (this.intervalHandle && !this.outOfFocusPause) {
      return (this.timeOffset + Date.now() - this.firstTick) / 1000;
    }

    return this.timeOffset;
  };
}
