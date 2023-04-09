import type { Sim } from "@core/sim";
import { System } from "./system";

export class CollectibleUnregisteringSystem extends System {
  apply = (sim: Sim) => {
    super.apply(sim);

    sim.hooks.phase.cleanup.tap(this.constructor.name, this.exec);
  };

  exec = (): void => {
    this.sim.queries.collectibles.get().forEach((entity) => {
      if (entity.cp.creationDate.date + 3600 < this.sim.getTime()) {
        entity.unregister();
      }
    });
  };
}
