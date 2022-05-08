import { MoveOrder, TeleportOrder } from "../../components/orders";
import { Position } from "../../components/position";
import { RequireComponent } from "../../tsHelpers";

export function moveOrder(
  entity: RequireComponent<"drive" | "orders">,
  order: MoveOrder
): boolean {
  entity.cp.drive.setTarget(order.position);

  const reached = entity.cp.drive.targetReached;

  if (reached) {
    entity.cp.drive.setTarget(null);
  }

  return reached;
}

export function teleportOrder(
  entity: RequireComponent<"position" | "orders">,
  order: TeleportOrder
): boolean {
  entity.cp.position = new Position(
    order.position.cp.position.coord,
    entity.cp.position.angle,
    order.position.cp.position.sector
  );

  return true;
}

export function holdPosition() {
  return false;
}
