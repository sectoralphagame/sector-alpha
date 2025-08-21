import type { Waypoint } from "@core/archetypes/waypoint";
import type { AttackAction, AttackOrder } from "@core/components/orders";
import type { RequireComponent } from "@core/tsHelpers";
import { clearTarget, moveToActions, setTarget } from "@core/utils/moving";
import { filter, first, map, min, pipe, sort, toArray } from "@fxts/core";
import type { Turret } from "@core/archetypes/turret";
import { entityIndexer } from "@core/entityIndexer/entityIndexer";
import { AttackingSystem } from "../attacking";
import { defaultIndexer } from "../utils/default";
import { SpottingSystem } from "../ai/spotting";

type OffensiveEntity = RequireComponent<
  "drive" | "movable" | "position" | "orders" | "children"
>;

export function attackOrder(entity: OffensiveEntity, group: AttackOrder) {
  const turrets = (entity.cp.children?.entities ?? [])
    .filter((c) => c.role === "turret")
    .map((c) => entity.sim.getOrThrow<Turret>(c.id));
  const range = pipe(
    turrets,
    map((t) => t.cp.damage.range),
    min
  );

  const target = entity.sim.getOrThrow<Waypoint>(group.targetId);
  entity.cp.drive.minimalDistance = range * 0.4;

  const shouldRecreatMoveActions =
    target.cp.position.sector !== group.ordersForSector;

  group.actions = [
    ...(shouldRecreatMoveActions ? moveToActions(entity, target) : []),
    { type: "attack", targetId: target.id },
  ];
  group.ordersForSector = target.cp.position.sector;

  if (
    (!group.followOutsideSector &&
      target.cp.position.sector !== entity.cp.position.sector) ||
    (group.maxDistance &&
      entity.cp.position.coord.squaredDistance(target.cp.position.coord) >
        group.maxDistance ** 2)
  ) {
    group.actions = [];
  }
}

export function isAttackOrderCompleted(
  entity: OffensiveEntity,
  group: AttackOrder
) {
  const target = group.targetId
    ? entity.sim.get<Waypoint>(group.targetId)
    : null;

  return !target
    ? true
    : group.followOutsideSector
    ? false
    : target.cp.position.sector !== entity.cp.position.sector ||
      (!!group.maxDistance &&
        entity.cp.position.coord.squaredDistance(target.cp.position.coord) >
          group.maxDistance ** 2);
}

export function attackAction(
  entity: RequireComponent<
    "drive" | "movable" | "orders" | "damage" | "position"
  >,
  action: AttackAction
): boolean {
  const turrets = pipe(
    entity.cp.children?.entities ?? [],
    filter((c) => c.role === "turret"),
    map((c) => entity.sim.getOrThrow<Turret>(c.id)),
    toArray
  );

  for (const turret of turrets) {
    if (!turret.cp.damage.targetId) {
      turret.cp.damage.targetId = action.targetId;
    }
  }

  if (
    entity.tags.has("role:military") &&
    entity.cp.dockable?.size === "small" &&
    (entity.cp.orders.value[0].type !== "attack" ||
      entity.cp.orders.value[0].origin === "auto")
  ) {
    const potentialTarget = pipe(
      defaultIndexer.sectorShips.getIt(entity.cp.position.sector),
      filter(
        (s) =>
          s.id !== entity.id &&
          turrets.some((t) =>
            AttackingSystem.isInShootingRange(
              t.cp.transform.world.coord,
              t.cp.transform.world.angle,
              s.cp.position.coord,
              t.cp.damage.range,
              t.cp.damage.angle
            )
          )
      ),
      map((s) => ({
        distance: s.cp.position.coord.squaredDistance(s.cp.position.coord),
        entity: s,
      })),
      sort((a, b) => a.distance - b.distance),
      first
    )?.entity;
    if (potentialTarget) {
      action.targetId = potentialTarget.id;
    }
  } else if (entity.cp.dockable?.size !== "small") {
    // Set turrets to attack either target or the closest ship in range
    const target = entity.sim.getOrThrow<Waypoint>(action.targetId);

    for (const turret of turrets) {
      turret.cp.damage.targetId = action.targetId;

      if (
        !AttackingSystem.isInShootingRange(
          turret.cp.transform.world.coord,
          turret.cp.transform.world.angle,
          target.cp.position.coord,
          turret.cp.damage.range,
          turret.cp.damage.angle
        )
      ) {
        const enemies = SpottingSystem.getEnemies(
          entityIndexer.searchBySector(entity.cp.position.sector, [
            "hitpoints",
            "owner",
            "position",
          ]),
          entity.requireComponents(["position", "owner"])
        );

        for (const enemy of enemies) {
          if (
            AttackingSystem.isInShootingRange(
              turret.cp.transform.world.coord,
              turret.cp.transform.world.angle,
              enemy.entity.cp.position.coord,
              turret.cp.damage.range,
              turret.cp.damage.angle
            )
          ) {
            turret.cp.damage.targetId = enemy.entity.id;
            break;
          }
        }
      }
    }
  }

  const target = entity.sim.getOrThrow<Waypoint>(action.targetId);
  setTarget(entity, action.targetId);

  if (target.cp.drive) {
    entity.cp.drive.mode =
      entity.cp.dockable?.size === "small" ? "flyby" : "follow";
  } else if (entity.cp.dockable?.size === "small") {
    entity.cp.drive.mode = "flyby";
  }

  return !entity.sim.get(action.targetId);
}

export function attackActionCleanup(entity: OffensiveEntity): void {
  clearTarget(entity);
  entity.cp.drive.limit = Infinity;
  entity.cp.drive.minimalDistance = 0.01;

  for (const turret of entity.cp.children?.entities ?? []) {
    const turretEntity = entity.sim.getOrThrow<Turret>(turret.id);
    turretEntity.cp.damage.targetId = null;
  }
}

export function attackOrderCompleted(entity: OffensiveEntity) {
  attackActionCleanup(entity);
}
