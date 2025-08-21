import type { Facility } from "@core/archetypes/facility";
import { facilityComponents } from "@core/archetypes/facility";
import { pickRandom } from "@core/utils/generators";
import { entityIndexer } from "@core/entityIndexer/entityIndexer";
import { System } from "../system";
import type { Sim } from "../../sim";
import { SpottingSystem } from "./spotting";
import { isInDistance } from "../attacking";

export class MilitaryModuleSpottingSystem extends System<"exec"> {
  apply = (sim: Sim) => {
    super.apply(sim);

    sim.hooks.phase.update.subscribe(this.constructor.name, this.exec);
  };

  exec = (): void => {
    if (!this.cooldowns.canUse("exec")) return;

    for (const entity of entityIndexer.search(
      ["parent", "damage"],
      ["facilityModule"]
    )) {
      const facility = this.sim.getOrThrow<Facility>(entity.cp.parent.id);
      if (
        !facility.cp.owner ||
        (entity.cp.damage.targetId &&
          this.sim.get(entity.cp.damage.targetId) &&
          isInDistance(entity, this.sim.get(entity.cp.damage.targetId)!))
      )
        return;

      const enemy = pickRandom(
        SpottingSystem.getEnemies(
          entityIndexer.searchBySector(facility.cp.position.sector, [
            "hitpoints",
            "owner",
            "position",
          ]),
          facility.requireComponents([...facilityComponents, "owner"])
        ).slice(0, 3)
      );

      if (enemy?.distance <= entity.cp.damage.range) {
        entity.cp.damage.targetId = enemy.entity.id;
      }
    }

    this.cooldowns.use("exec", 1 + Math.random());
  };
}

export const militaryModuleSpottingSystem = new MilitaryModuleSpottingSystem();
