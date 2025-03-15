import type { Sim } from "@core/sim";
import { dumpCargo } from "@core/components/storage";
import type { Faction } from "@core/archetypes/faction";
import { entityIndexer } from "@core/entityIndexer/entityIndexer";
import { System } from "./system";
import { transport3D } from "./transport3d";

export class DeadUnregisteringSystem extends System {
  apply = (sim: Sim) => {
    super.apply(sim);

    sim.hooks.phase.cleanup.subscribe(this.constructor.name, this.exec);
  };

  exec = (): void => {
    for (const entity of entityIndexer.search(["hitpoints"])) {
      if (entity.cp.hitpoints.hp.value <= 0) {
        if (entity.cp.storage) {
          dumpCargo(entity.requireComponents(["storage"]));
        }
        if (entity.hasComponents(["owner", "name", "position"])) {
          const owner = this.sim.getOrThrow<Faction>(entity.cp.owner.id);
          owner.cp.journal.entries.push({
            type: "destroy",
            entity: entity.cp.name.value,
            sectorId: entity.cp.position.sector,
            time: this.sim.getTime(),
          });
        }
        if (entity.hasComponents(["position"]))
          transport3D.hooks.explode.notify(entity);
        entity.unregister("dead");
      }
    }
  };
}

export const deadUnregisteringSystem = new DeadUnregisteringSystem();
