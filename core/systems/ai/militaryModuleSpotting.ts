import type { RequireComponent } from "@core/tsHelpers";
import type { Facility } from "@core/archetypes/facility";
import { facilityComponents } from "@core/archetypes/facility";
import { pickRandom } from "@core/utils/generators";
import { System } from "../system";
import type { Sim } from "../../sim";
import { Query } from "../utils/query";
import { SpottingSystem } from "./spotting";
import { SectorQuery } from "../utils/sectorQuery";
import { isInDistance } from "../attacking";

export class MilitaryModuleSpottingSystem extends System<"exec"> {
  queries: {
    enemies: SectorQuery<"hitpoints" | "owner" | "position">;
    modules: Query<"parent" | "damage">;
  };

  apply = (sim: Sim) => {
    super.apply(sim);

    this.queries = {
      enemies: new SectorQuery(sim, ["hitpoints", "owner", "position"]),
      modules: new Query(sim, ["parent", "damage"], ["facilityModule"]),
    };

    sim.hooks.phase.update.tap(this.constructor.name, this.exec);
  };

  exec = (): void => {
    if (!this.cooldowns.canUse("exec")) return;

    const cache: Record<
      string,
      Array<RequireComponent<"hitpoints" | "owner" | "position">>
    > = {};

    this.queries.modules.get().forEach((entity) => {
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
          this.queries.enemies.get(facility.cp.position.sector),
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
