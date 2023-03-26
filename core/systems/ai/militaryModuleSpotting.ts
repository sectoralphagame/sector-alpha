import { filter, map, pipe, reduce, toArray } from "@fxts/core";
import type { Faction } from "@core/archetypes/faction";
import { relationThresholds } from "@core/components/relations";
import { distance } from "mathjs";
import type { RequireComponent } from "@core/tsHelpers";
import type { Facility } from "@core/archetypes/facility";
import { System } from "../system";
import type { Sim } from "../../sim";
import { Cooldowns } from "../../utils/cooldowns";
import { Query } from "../query";

export class MilitaryModuleSpottingSystem extends System {
  cooldowns: Cooldowns<"exec">;
  queries: {
    enemies: Query<"hitpoints" | "owner" | "position">;
    modules: Query<"parent" | "damage">;
  };

  constructor(sim: Sim) {
    super(sim);
    this.cooldowns = new Cooldowns("exec");
    this.queries = {
      enemies: new Query(sim, ["hitpoints", "owner", "position"]),
      modules: new Query(sim, ["parent", "damage"], ["facilityModule"]),
    };
  }

  exec = (delta: number): void => {
    this.cooldowns.update(delta);
    if (!this.cooldowns.canUse("exec")) return;

    const cache: Record<
      string,
      Array<RequireComponent<"hitpoints" | "owner" | "position">>
    > = {};

    this.queries.modules.get().forEach((entity) => {
      const facility = this.sim.getOrThrow<Facility>(entity.cp.parent.id);
      if (!facility.cp.owner) return;

      const entityPosition = facility.cp.position;
      const entityOwner = this.sim.getOrThrow<Faction>(facility.cp.owner.id);

      const cacheKey = [entityOwner.id, entityPosition.sector].join(":");
      const enemies =
        cache[cacheKey] ??
        pipe(
          this.queries.enemies.get(),
          filter(
            (e) =>
              e.tags.has("ship") &&
              entityOwner &&
              e.cp.position.sector === entityPosition.sector &&
              entityOwner.cp.relations.values[e.cp.owner.id]! <
                relationThresholds.attack
          ),
          toArray
        );
      if (!cache[cacheKey]) {
        cache[cacheKey] = enemies;
      }
      const closestEnemy = pipe(
        enemies,
        map((e) => ({
          entity: e,
          distance: distance(
            e.cp.position.coord,
            entityPosition.coord
          ) as number,
        })),
        reduce((acc, e) => (acc.distance > e.distance ? e : acc))
      );

      if (closestEnemy?.distance <= entity.cp.damage.range) {
        entity.cp.damage.targetId = closestEnemy.entity.id;
      }
    });

    this.cooldowns.use("exec", 1.5);
  };
}
