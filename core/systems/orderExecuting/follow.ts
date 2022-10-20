import { Marker } from "@core/archetypes/marker";
import { FollowOrder } from "@core/components/orders";
import { RequireComponent } from "@core/tsHelpers";
import { moveToOrders } from "@core/utils/moving";

export function followOrder(
  entity: RequireComponent<"drive" | "position" | "orders">,
  order: FollowOrder
): boolean {
  const target = entity.sim.getOrThrow<Marker>(order.targetId);
  const lastMoveOrder = entity.cp.orders.value[0].orders
    .filter((o) => o.type === "move")
    .at(-1);

  if (!lastMoveOrder) {
    entity.cp.orders.value[0].orders.unshift(...moveToOrders(entity, target));
  } else {
    const inTheSameSector =
      target.cp.position.sector !== entity.cp.position.sector;

    if (!inTheSameSector) {
      entity.cp.orders.value[0].orders = [
        ...moveToOrders(entity, target),
        order,
      ];
    }
  }

  return false;
}
