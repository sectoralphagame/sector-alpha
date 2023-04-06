import type { Sim } from "../sim";

/**
 * Base class to extend new systems. Use `-ingSystem` postfix in system names.
 */
export abstract class System {
  protected sim: Sim;

  // eslint-disable-next-line class-methods-use-this
  destroy() {}

  apply(sim: Sim) {
    this.sim = sim;

    sim.hooks.destroy.tap(this.constructor.name, this.destroy);
  }
}
