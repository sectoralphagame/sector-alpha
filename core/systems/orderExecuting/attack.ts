import type { Marker } from "@core/archetypes/marker";
import { clearTarget } from "@core/components/drive";
import type { FollowOrder, MoveAction } from "@core/components/orders";
import type { RequireComponent } from "@core/tsHelpers";
import { moveToActions } from "@core/utils/moving";

export function attackOrder(
  entity: RequireComponent<"drive" | "position" | "orders" | "damage">,
  group: FollowOrder
) {
  entity.cp.drive.minimalDistance = entity.cp.damage.range * 0.9;
  entity.cp.damage.targetId = group.targetId;
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

export function attackOrderGroup(
  entity: RequireComponent<"drive" | "position" | "orders" | "damage">
) {
  clearTarget(entity.cp.drive);
  entity.cp.drive.limit = Infinity;
  entity.cp.drive.minimalDistance = 0.01;
  entity.cp.damage.targetId = null;
}
