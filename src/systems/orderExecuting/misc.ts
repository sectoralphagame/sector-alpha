import { MoveOrder, TeleportOrder } from "../../components/orders";
import { Position } from "../../components/position";
import { RequireComponent } from "../../tsHelpers";

export function moveOrder(
  entity: RequireComponent<"drive" | "orders">,
  order: MoveOrder
): boolean {
  entity.cp.drive.setTarget(order.position);

  if (entity.cp.dockable?.docked) {
    entity.cp.dockable.docked.cp.docks.docked =
      entity.cp.dockable.docked.cp.docks.docked.filter(
        (e) => e.id !== entity.id
      );
    entity.cp.dockable.docked = null;
    if (entity.cp.render) {
      entity.cp.render.show();
    }
  }

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

  entity.cp.docks?.docked.forEach((docked) => {
    docked.cp.position = new Position(
      order.position.cp.position.coord,
      entity.cp.position.angle,
      order.position.cp.position.sector
    );
  });

  return true;
}

export function holdPosition() {
  return false;
}
