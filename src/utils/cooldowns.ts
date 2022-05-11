import { limitMin } from "./limit";

export class Cooldowns<T extends string> {
  timers: Record<T, number>;

  constructor(...keys: T[]) {
    const timers = {} as Record<string, number>;

    keys.forEach((key) => {
      timers[key] = 0;
    });

    this.timers = timers;
  }

  canUse(key: T) {
    return this.timers[key] === 0;
  }

  use(key: T, time: number) {
    if (this.canUse(key)) {
      this.timers[key] = time;
    }
  }

  update(delta: number) {
    Object.keys(this.timers).forEach((key) => {
      this.timers[key] = limitMin(this.timers[key] - delta, 0);
    });
  }

  copy(): Cooldowns<T> {
    const copy = new Cooldowns(Object.keys(this.timers) as unknown as T);
    Object.keys(this.timers).forEach((key) => {
      copy.timers[key] = this.timers[key];
    });

    return copy;
  }

  reset(): void {
    Object.keys(this.timers).forEach((key) => {
      this.timers[key] = 0;
    });
  }
}
