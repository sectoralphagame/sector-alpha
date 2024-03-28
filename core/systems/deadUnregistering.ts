import type { Sim } from "@core/sim";
import { dumpCargo } from "@core/components/storage";
import { Query } from "./utils/query";
import { System } from "./system";

export class DeadUnregisteringSystem extends System {
  query: Query<"hitpoints">;

  apply = (sim: Sim) => {
    super.apply(sim);

    this.query = new Query(sim, ["hitpoints"]);

    sim.hooks.phase.cleanup.subscribe(this.constructor.name, this.exec);
  };

  exec = (): void => {
    for (const entity of this.query.getIt()) {
      if (entity.cp.hitpoints.hp.value <= 0) {
        if (entity.cp.storage) {
          dumpCargo(entity.requireComponents(["storage"]));
        }
        entity.unregister();
      }
    }
  };
}
