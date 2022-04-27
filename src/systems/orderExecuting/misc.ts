import { MoveOrder } from "../../entities/ship";
import { RequireComponent } from "../../tsHelpers";

export function moveOrder(
  entity: RequireComponent<"drive" | "orders">,
  order: MoveOrder
): boolean {
  entity.cp.drive.setTarget(order.position);

  return entity.cp.drive.targetReached;
}

export function holdPosition() {
  return false;
}
