import { Marker } from "@core/archetypes/marker";
import { clearTarget } from "@core/components/drive";
import { FollowOrderGroup, MoveOrder } from "@core/components/orders";
import { RequireComponent } from "@core/tsHelpers";
import { moveToOrders } from "@core/utils/moving";
import { norm, subtract } from "mathjs";

export function followOrderGroup(
  entity: RequireComponent<"drive" | "position" | "orders">,
  group: FollowOrderGroup
) {
  const target = entity.sim.getOrThrow<Marker>(group.targetId);
  const moveOrders = group.orders.filter((o) => o.type === "move");
  const lastMoveOrder = moveOrders.at(-1) as MoveOrder;
  const inTheSameSector =
    target.cp.position.sector === entity.cp.position.sector;

  const shouldRecreateOrders = lastMoveOrder
    ? target.cp.position.sector !== group.ordersForSector
    : true;

  if (shouldRecreateOrders) {
    group.orders = moveToOrders(entity, target);
    group.ordersForSector = target.cp.position.sector;
  }

  if (inTheSameSector) {
    const distance = norm(
      subtract(entity.cp.position.coord, target.cp.position.coord)
    );
    entity.cp.drive.minimalDistance = 0.1;

    if (distance <= 0.5) {
      entity.cp.drive.limit = target.cp.drive!.currentSpeed;
    } else {
      entity.cp.drive.limit = 2000;
    }
  } else {
    entity.cp.drive.minimalDistance = 0.01;
  }
}

export function follorOrderGroupCleanup(
  entity: RequireComponent<"drive" | "position" | "orders">
) {
  clearTarget(entity.cp.drive);
  entity.cp.drive.limit = Infinity;
  entity.cp.drive.minimalDistance = 0.01;
}
