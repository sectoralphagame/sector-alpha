import { System } from "./system";

export abstract class SystemWithHooks extends System {
  private hooks: Record<number, any> = {};
  private hookCounter: number = 0;

  hook(value: any, cb: () => void): void {
    if (this.hooks[this.hookCounter] !== value) {
      this.hooks[this.hookCounter] = value;
      cb();
    }
    this.hookCounter += 1;
  }

  // eslint-disable-next-line no-unused-vars
  exec(delta: number) {
    this.hookCounter = 0;
  }
}
