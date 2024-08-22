import type { RequireComponent } from "@core/tsHelpers";
import type { Facility } from "@core/archetypes/facility";
import { facilityComponents } from "@core/archetypes/facility";
import { pickRandom } from "@core/utils/generators";
import { System } from "../system";
import type { Sim } from "../../sim";
import { Index } from "../utils/entityIndex";
import { SpottingSystem } from "./spotting";
import { SectorIndex } from "../utils/sectorIndex";
import { isInDistance } from "../attacking";

export class MilitaryModuleSpottingSystem extends System<"exec"> {
  indexes: {
    enemies: SectorIndex<"hitpoints" | "owner" | "position">;
    modules: Index<"parent" | "damage">;
  };

  apply = (sim: Sim) => {
    super.apply(sim);

    this.indexes = {
      enemies: new SectorIndex(sim, ["hitpoints", "owner", "position"]),
      modules: new Index(sim, ["parent", "damage"], ["facilityModule"]),
    };

    sim.hooks.phase.update.subscribe(this.constructor.name, this.exec);
  };

  exec = (): void => {
    if (!this.cooldowns.canUse("exec")) return;

    const cache: Record<
      string,
      Array<RequireComponent<"hitpoints" | "owner" | "position">>
    > = {};

    this.indexes.modules.get().forEach((entity) => {
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
          this.indexes.enemies.get(facility.cp.position.sector),
          cache,
          facility.requireComponents([...facilityComponents, "owner"])
        ).slice(0, 3)
      );

      if (enemy?.distance <= entity.cp.damage.range) {
        entity.cp.damage.targetId = enemy.entity.id;
      }
    });

    this.cooldowns.use("exec", 1 + Math.random());
  };
}

export const militaryModuleSpottingSystem = new MilitaryModuleSpottingSystem();
