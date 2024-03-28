import type { Sim } from "@core/sim";
import { System } from "./system";

export class CollectibleUnregisteringSystem extends System {
  apply = (sim: Sim) => {
    super.apply(sim);

    sim.hooks.phase.cleanup.subscribe(this.constructor.name, this.exec);
  };

  exec = (): void => {
    for (const entity of this.sim.queries.collectibles.getIt()) {
      if (entity.cp.creationDate.date + 3600 < this.sim.getTime()) {
        entity.unregister();
      }
    }
  };
}
