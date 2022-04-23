import { notImplemented } from "../errors";
import { Sim } from "../sim";

export abstract class System {
  sim: Sim;

  constructor(sim: Sim) {
    this.sim = sim;
  }
  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  exec(delta: number): void {
    throw notImplemented;
  }
}
