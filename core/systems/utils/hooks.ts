import { System } from "../system";

export abstract class SystemWithHooks<
  TCooldowns extends string | never = never
> extends System<TCooldowns> {
  private hooks: Record<number, any> = {};
  private hookCounter: number = 0;

  // eslint-disable-next-line no-unused-vars
  onChange<T>(value: T, cb: (previousValue: T) => void): void {
    if (this.hooks[this.hookCounter] !== value) {
      cb(this.hooks[this.hookCounter]);
      this.hooks[this.hookCounter] = value;
    }
    this.hookCounter += 1;
  }

  // eslint-disable-next-line no-unused-vars
  exec(delta: number) {
    this.hookCounter = 0;
  }
}
