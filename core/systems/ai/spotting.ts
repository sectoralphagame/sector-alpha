import { filter, map, pipe, sort, toArray } from "@fxts/core";
import type { Faction } from "@core/archetypes/faction";
import { relationThresholds } from "@core/components/relations";
import { distance } from "mathjs";
import type { RequireComponent } from "@core/tsHelpers";
import { pickRandom } from "@core/utils/generators";
import { System } from "../system";
import type { Sim } from "../../sim";
import { Cooldowns } from "../../utils/cooldowns";
import { SectorQuery } from "../utils/sectorQuery";

export type EnemyArrayCache = Record<
  string,
  Array<RequireComponent<"hitpoints" | "owner" | "position">>
>;

export class SpottingSystem extends System {
  cooldowns: Cooldowns<"exec">;
  query: SectorQuery<"hitpoints" | "owner" | "position">;

  constructor() {
    super();
    this.cooldowns = new Cooldowns("exec");
  }

  apply = (sim: Sim) => {
    super.apply(sim);

    this.query = new SectorQuery(sim, ["hitpoints", "owner", "position"]);

    sim.hooks.phase.update.tap(this.constructor.name, this.exec);
  };

  static getEnemies(
    potentialEnemies: RequireComponent<"hitpoints" | "owner" | "position">[],
    cache: EnemyArrayCache,
    entity: RequireComponent<"owner" | "position">
  ) {
    const entityOwner = entity.sim.getOrThrow<Faction>(entity.cp.owner.id);

    const cacheKey = [entity.cp.owner!.id, entity.cp.position.sector].join(":");
    const enemies =
      cache[cacheKey] ??
      pipe(
        potentialEnemies,
        filter(
          (e) =>
            e.cp.owner.id !== entityOwner.id &&
            (entityOwner.cp.relations.values[e.cp.owner.id]! <
              relationThresholds.attack ||
              (entityOwner.cp.ai?.restrictions.mining && e.cp.mining?.entityId))
        ),
        toArray
      );
    if (!cache[cacheKey]) {
      cache[cacheKey] = enemies;
    }

    return pipe(
      enemies,
      map((e) => ({
        entity: e,
        distance: distance(
          e.cp.position.coord,
          entity.cp.position.coord
        ) as number,
      })),
      sort((a, b) => (a.distance > b.distance ? 1 : -1)),
      toArray
    );
  }

  exec = (delta: number): void => {
    this.cooldowns.update(delta);
    if (!this.cooldowns.canUse("exec")) return;

    const cache: EnemyArrayCache = {};

    this.sim.queries.orderable.get().forEach((entity) => {
      if (
        entity.cp.orders.value[0]?.type !== "patrol" &&
        entity.cp.orders.value[0]?.type !== "escort"
      )
        return;

      if (
        !entity.cp.owner ||
        (entity.cp.orders.value[0].type === "patrol" &&
          entity.cp.position.sector !== entity.cp.orders.value[0].sectorId)
      )
        return;

      const enemy = pickRandom(
        SpottingSystem.getEnemies(
          this.query.get(entity.cp.position.sector),
          cache,
          entity
        ).slice(0, 3)
      );

      if (enemy?.distance <= 8) {
        entity.cp.orders.value[0].interrupt = true;
        entity.cp.orders.value.splice(1, 0, {
          type: "attack",
          ordersForSector: entity.cp.position.sector,
          origin: "auto",
          targetId: enemy.entity.id,
          actions: [],
          followOutsideSector: false,
        });
      }
    });

    this.cooldowns.use("exec", 1 + Math.random());
  };
}
