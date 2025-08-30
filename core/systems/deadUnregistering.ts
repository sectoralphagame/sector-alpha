import type { Sim } from "@core/sim";
import { dumpCargo } from "@core/components/storage";
import type { Faction } from "@core/archetypes/faction";
import { entityIndexer } from "@core/entityIndexer/entityIndexer";
import type { DockSize } from "@core/components/dockable";
import { addExperience } from "@core/components/experience";
import { findInAncestors } from "@core/utils/findInAncestors";
import { System } from "./system";
import { transport3D } from "./transport3d";

const expValues: Record<DockSize, number> = {
  large: 200,
  medium: 50,
  small: 20,
};
const timestampThreshold = 120; // 2 minutes

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
          transport3D.publish({
            type: "explode",
            entity,
          });

        const attackers: number[] = [];

        for (const [attackerId, timestamp] of Object.entries(
          entity.cp.hitpoints.hitBy
        )) {
          if (timestamp + timestampThreshold > this.sim.getTime()) {
            attackers.push(Number(attackerId));
          }
        }

        const exp =
          expValues[entity.cp.dockable?.size || "small"] / attackers.length;
        for (const attackerId of attackers) {
          const attacker = this.sim.get(attackerId);
          if (!attacker) continue;

          const parentWithExperience = findInAncestors(attacker, "experience");
          if (parentWithExperience) {
            addExperience(parentWithExperience, exp);
          }
        }

        entity.unregister("dead");
      }
    }
  };
}

export const deadUnregisteringSystem = new DeadUnregisteringSystem();
