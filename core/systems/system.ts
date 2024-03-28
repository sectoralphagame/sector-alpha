import { Cooldowns } from "@core/utils/cooldowns";
import type { Sim } from "../sim";

/**
 * Base class to extend new systems. Use `-ingSystem` postfix in system names.
 */
export abstract class System<T extends string | never = never> {
  public cooldowns: Cooldowns<T>;
  protected sim: Sim;

  constructor() {
    this.cooldowns = new Cooldowns<T>();
  }

  // eslint-disable-next-line class-methods-use-this
  destroy() {}

  apply(sim: Sim) {
    this.sim = sim;

    sim.hooks.phase.start.subscribe(
      this.constructor.name,
      this.cooldowns.update
    );
    sim.hooks.destroy.subscribe(this.constructor.name, this.destroy);
  }
}
