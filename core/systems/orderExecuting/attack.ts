import type { Waypoint } from "@core/archetypes/waypoint";
import { clearTarget, setTarget } from "@core/components/drive";
import type {
  AttackAction,
  AttackOrder,
  MoveAction,
} from "@core/components/orders";
import type { RequireComponent } from "@core/tsHelpers";
import { moveToActions } from "@core/utils/moving";
import { isInDistance } from "../attacking";

export function attackOrder(
  entity: RequireComponent<"drive" | "position" | "orders" | "damage">,
  group: AttackOrder
) {
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
  entity: RequireComponent<"drive" | "position" | "orders" | "damage">,
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
  entity: RequireComponent<"drive" | "orders" | "damage" | "position">,
  action: AttackAction
): boolean {
  const target = entity.sim.getOrThrow<Waypoint>(action.targetId);
  setTarget(entity.cp.drive, action.targetId);

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

export function attackActionCleanup(
  entity: RequireComponent<"drive" | "position" | "orders" | "damage">
): void {
  clearTarget(entity.cp.drive);
  entity.cp.drive.limit = Infinity;
  entity.cp.drive.minimalDistance = 0.01;
  entity.cp.damage.targetId = null;
}

export function attackOrderCompleted(
  entity: RequireComponent<"drive" | "position" | "orders" | "damage">
) {
  attackActionCleanup(entity);
}
