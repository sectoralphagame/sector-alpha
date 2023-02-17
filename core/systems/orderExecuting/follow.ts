import type { Marker } from "@core/archetypes/marker";
import { clearTarget } from "@core/components/drive";
import type { FollowOrder, MoveAction } from "@core/components/orders";
import type { RequireComponent } from "@core/tsHelpers";
import { moveToActions } from "@core/utils/moving";

export function followOrder(
  entity: RequireComponent<"drive" | "position" | "orders">,
  group: FollowOrder
) {
  const target = entity.sim.getOrThrow<Marker>(group.targetId);
  const moveOrders = group.actions.filter((o) => o.type === "move");
  const lastMoveOrder = moveOrders.at(-1) as MoveAction;
  const inTheSameSector =
    target.cp.position.sector === entity.cp.position.sector;

  const shouldRecreateOrders = lastMoveOrder
    ? target.cp.position.sector !== group.ordersForSector
    : true;

  if (shouldRecreateOrders) {
    group.actions = moveToActions(entity, target);
    group.ordersForSector = target.cp.position.sector;
  }

  entity.cp.drive.mode = inTheSameSector ? "follow" : "goto";
}

export function follorOrderGroup(
  entity: RequireComponent<"drive" | "position" | "orders">
) {
  clearTarget(entity.cp.drive);
  entity.cp.drive.limit = Infinity;
  entity.cp.drive.minimalDistance = 0.01;
}
