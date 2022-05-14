import { WithDock } from "../../components/dockable";
import { DockOrder } from "../../components/orders";
import { DockSizeMismatchError } from "../../errors";
import { RequireComponent } from "../../tsHelpers";

export function dockShip(
  ship: RequireComponent<"drive" | "dockable" | "position">,
  dock: WithDock
) {
  dock.cp.docks.docked.push(ship);
  ship.cp.dockable.docked = dock;
  ship.cp.drive.target = null;
  if (ship.cp.render) {
    ship.cp.render.hide();
  }
}

export function dockOrder(
  entity: RequireComponent<"drive" | "dockable" | "position">,
  order: DockOrder
): boolean {
  entity.cp.drive.setTarget(order.target);
  const { docks } = order.target.cp;
  entity.cp.drive.target = order.target;

  if (entity.cp.dockable.size !== docks.size) {
    throw new DockSizeMismatchError(entity.cp.dockable.size, docks.size);
  }

  if (entity.cp.drive.targetReached && docks.pads > docks.docked.length) {
    dockShip(entity, order.target);

    return true;
  }

  return false;
}
