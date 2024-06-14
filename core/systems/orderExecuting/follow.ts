import type { Waypoint } from "@core/archetypes/waypoint";
import type { FollowOrder, MoveAction } from "@core/components/orders";
import type { RequireComponent } from "@core/tsHelpers";
import { clearTarget, moveToActions } from "@core/utils/moving";

export function followOrder(
  entity: RequireComponent<"drive" | "position" | "orders">,
  group: FollowOrder
) {
  const target = entity.sim.getOrThrow<Waypoint>(group.targetId);
  const moveOrders = group.actions.filter((o) => o.type === "move");
  const lastMoveOrder = moveOrders.at(-1) as MoveAction;
  const inTheSameSector =
    target.cp.position.sector === entity.cp.position.sector;

  const shouldRecreateOrders = lastMoveOrder
    ? target.cp.position.sector !== group.ordersForSector
    : true;

  if (shouldRecreateOrders) {
    entity.cp.orders.value[0].actions = moveToActions(entity, target, {
      ignoreReached: true,
    });
    (entity.cp.orders.value[0] as FollowOrder).ordersForSector =
      target.cp.position.sector;
  }

  entity.cp.drive.mode = inTheSameSector ? "follow" : "goto";
}

export function followOrderCompleted(
  entity: RequireComponent<"drive" | "movable" | "position" | "orders">
) {
  clearTarget(entity);
  entity.cp.drive.limit = Infinity;
  entity.cp.drive.minimalDistance = 0.01;
}
