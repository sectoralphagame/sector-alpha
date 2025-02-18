import { Exclude, Expose } from "class-transformer";
import { notImplemented } from "../errors";
import settings from "../settings";

let counter = 1;

@Exclude()
export class BaseSim {
  id: number;
  firstTick: number;
  lastTick: number;
  intervalHandle: number | null;
  @Expose()
  timeOffset: number;
  speed = 1;
  prevSpeed = 1;

  constructor() {
    this.id = counter;
    counter += 1;
    this.timeOffset = 0;
  }

  setSpeed(value: number) {
    this.prevSpeed = this.speed;
    this.speed = value;
  }

  start() {
    if (this.intervalHandle) return;

    this.intervalHandle = setInterval(() => {
      try {
        let delta = ((Date.now() - this.lastTick) / 1000) * this.speed;
        const deltaThreshold = (this.speed * 3) / settings.global.targetFps;

        if (delta > deltaThreshold) {
          delta = deltaThreshold;
          // eslint-disable-next-line no-console
          console.warn("Throttling sim");
        }
        this.next(delta);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        // eslint-disable-next-line no-console
        console.error(
          `This error occured at ${this.getTime().toFixed(3)} in sim #${
            this.id
          }`
        );
        this.stop();
      }
    }, 1e3 / settings.global.targetFps) as unknown as number;
    this.lastTick = Date.now();
  }

  updateTimer = (delta: number) => {
    this.timeOffset += delta;
    this.lastTick = Date.now();
  };

  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  next = (delta: number): void => {
    throw notImplemented;
  };

  pause = (): void => {
    this.setSpeed(0);
  };

  unpause = (): void => {
    this.setSpeed(this.prevSpeed);
  };

  stop = () => {
    clearInterval(this.intervalHandle!);
    this.intervalHandle = null;
  };

  getTime = (): number => this.timeOffset;
}
