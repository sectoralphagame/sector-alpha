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
  const { size } = entity.cp.dockable;
  entity.cp.drive.target = order.target;

  if (docks.pads[size] === 0) {
    throw new DockSizeMismatchError(size);
  }

  if (
    entity.cp.drive.targetReached &&
    docks.available(size) > docks.docked.length
  ) {
    dockShip(entity, order.target);

    return true;
  }

  return false;
}
