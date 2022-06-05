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
    if (this.timers[key] === undefined) {
      this.add(key);
    }
    return this.timers[key] === 0;
  }

  use(key: T, time: number) {
    if (this.timers[key] === undefined) {
      this.add(key);
    }
    if (this.canUse(key)) {
      this.timers[key] = time;
    }
  }

  update(delta: number) {
    Object.keys(this.timers).forEach((key) => {
      this.timers[key] = limitMin(this.timers[key] - delta, 0);
    });
  }

  reset(): void {
    Object.keys(this.timers).forEach((key) => {
      this.timers[key] = 0;
    });
  }

  add(name: string) {
    this.timers[name] = 0;
  }

  remove(name: string) {
    delete this.timers[name];
  }
}
