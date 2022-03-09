import settings from "../settings";

export class Sim {
  lastTick: number;
  intervalHandle: number;

  start = () => {
    this.intervalHandle = setInterval(() => {
      this.next(Date.now() - this.lastTick);
      this.lastTick = Date.now();
    }, 1e3 / settings.global.targetFps) as unknown as number;
    this.lastTick = Date.now();
  };

  next = (delta: number) => {};

  pause = () => {
    clearInterval(this.intervalHandle);
    this.intervalHandle = null;
  };
}
