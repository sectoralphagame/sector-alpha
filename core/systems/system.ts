import { notImplemented } from "../errors";
import type { Sim } from "../sim";

/**
 * Base class to extend new systems. Use `-ingSystem` postfix in system names.
 */
export abstract class System {
  sim: Sim;

  constructor(sim: Sim) {
    this.sim = sim;
  }

  // eslint-disable-next-line class-methods-use-this
  destroy() {}

  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  exec(delta: number): void {
    throw notImplemented;
  }
}
