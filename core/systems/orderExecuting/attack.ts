import type { Waypoint } from "@core/archetypes/waypoint";
import type {
  AttackAction,
  AttackOrder,
  MoveAction,
} from "@core/components/orders";
import type { RequireComponent } from "@core/tsHelpers";
import { clearTarget, moveToActions, setTarget } from "@core/utils/moving";
import { isInDistance } from "../attacking";

type OffensiveEntity = RequireComponent<
  "drive" | "movable" | "position" | "orders" | "damage"
>;

export function attackOrder(entity: OffensiveEntity, group: AttackOrder) {
  entity.cp.drive.minimalDistance = entity.cp.damage.range * 0.4;
  entity.cp.damage.targetId = group.targetId;
  const target = entity.sim.getOrThrow<Waypoint>(group.targetId);
  const moveOrders = group.actions.filter((o) => o.type === "move");
  const lastMoveOrder = moveOrders.at(-1) as MoveAction;
  const isInRange = isInDistance(entity, target);

  const shouldRecreateOrders = lastMoveOrder
    ? target.cp.position.sector !== group.ordersForSector
    : true;

  if (shouldRecreateOrders) {
    group.actions = [
      ...(isInRange ? [] : moveToActions(entity, target)),
      { type: "attack", targetId: target.id },
    ];
    group.ordersForSector = target.cp.position.sector;
  }

  if (
    (!group.followOutsideSector &&
      target.cp.position.sector !== entity.cp.position.sector) ||
    (group.maxDistance && !isInDistance(entity, target, group.maxDistance))
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
      (!!group.maxDistance && !isInDistance(entity, target, group.maxDistance));
}

export function attackAction(
  entity: RequireComponent<
    "drive" | "movable" | "orders" | "damage" | "position"
  >,
  action: AttackAction
): boolean {
  const target = entity.sim.getOrThrow<Waypoint>(action.targetId);
  setTarget(entity, action.targetId);

  if (target.cp.drive) {
    entity.cp.drive.mode =
      entity.cp.dockable?.size === "small" ? "flyby" : "follow";
  } else if (entity.cp.dockable?.size === "small") {
    entity.cp.drive.mode = "flyby";
  }

  return entity.cp.damage.targetId
    ? !entity.sim.get(entity.cp.damage.targetId)
    : true;
}

export function attackActionCleanup(entity: OffensiveEntity): void {
  clearTarget(entity);
  entity.cp.drive.limit = Infinity;
  entity.cp.drive.minimalDistance = 0.01;
  entity.cp.damage.targetId = null;
}

export function attackOrderCompleted(entity: OffensiveEntity) {
  attackActionCleanup(entity);
}
