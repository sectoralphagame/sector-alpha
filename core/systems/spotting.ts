import { filter, map, pipe, reduce, toArray } from "@fxts/core";
import type { Faction } from "@core/archetypes/faction";
import { relationThresholds } from "@core/components/relations";
import { distance } from "mathjs";
import type { RequireComponent } from "@core/tsHelpers";
import { System } from "./system";
import type { Sim } from "../sim";
import { Cooldowns } from "../utils/cooldowns";
import { Query } from "./query";

export class SpottingSystem extends System {
  cooldowns: Cooldowns<"exec">;
  query: Query<"hitpoints" | "owner" | "position">;

  constructor(sim: Sim) {
    super(sim);
    this.cooldowns = new Cooldowns("exec");
    this.query = new Query(sim, ["hitpoints", "owner", "position"]);
  }

  exec = (delta: number): void => {
    this.cooldowns.update(delta);
    if (!this.cooldowns.canUse("exec")) return;

    const cache: Record<
      string,
      Array<RequireComponent<"hitpoints" | "owner" | "position">>
    > = {};

    this.sim.queries.orderable.get().forEach((entity) => {
      if (entity.cp.orders.value[0]?.type !== "patrol") return;

      if (!entity.cp.owner) return;
      const entityOwner = this.sim.getOrThrow<Faction>(entity.cp.owner.id);

      const cacheKey = [entity.cp.owner!.id, entity.cp.position.sector].join(
        ":"
      );
      const enemies =
        cache[cacheKey] ??
        pipe(
          this.query.get(),
          filter(
            (e) =>
              entity.cp.owner &&
              entityOwner &&
              e.cp.position.sector === entity.cp.position.sector &&
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
            entity.cp.position.coord
          ) as number,
        })),
        reduce((acc, e) => (acc.distance > e.distance ? e : acc))
      );

      if (closestEnemy?.distance <= 8) {
        entity.cp.orders.value[0].interrupt = true;
        entity.cp.orders.value.splice(1, 0, {
          type: "attack",
          ordersForSector: entity.cp.position.sector,
          origin: "auto",
          targetId: closestEnemy.entity.id,
          actions: [],
        });
      }
    });

    this.cooldowns.use("exec", 1.5);
  };
}
