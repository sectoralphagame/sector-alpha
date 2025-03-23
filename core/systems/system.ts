import { Cooldowns } from "@core/utils/cooldowns";
import type { SubLogger } from "@core/log";
import { systemLogger } from "@core/log";
import type { Sim } from "../sim";

/**
 * Base class to extend new systems. Use `-ingSystem` postfix in system names.
 */
export abstract class System<T extends string | never = never> {
  public cooldowns: Cooldowns<T>;
  protected sim: Sim;
  protected logger: SubLogger;

  constructor() {
    this.cooldowns = new Cooldowns<T>();
    this.logger = systemLogger.sub(this.constructor.name);
  }

  // eslint-disable-next-line class-methods-use-this
  destroy() {}

  apply(sim: Sim) {
    this.sim = sim;
    this.logger.log("Applying system");

    sim.hooks.phase.start.subscribe(
      this.constructor.name,
      this.cooldowns.update
    );
    sim.hooks.destroy.subscribe(this.constructor.name, this.destroy);
  }
}
