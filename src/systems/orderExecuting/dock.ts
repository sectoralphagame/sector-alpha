import { availableDocks, WithDock } from "../../components/dockable";
import { setTarget } from "../../components/drive";
import { DockOrder } from "../../components/orders";
import {
  addEntity,
  clearEntity,
  setEntity,
} from "../../components/utils/entityId";
import { DockSizeMismatchError } from "../../errors";
import { RequireComponent } from "../../tsHelpers";

export function dockShip(
  ship: RequireComponent<"drive" | "dockable" | "position">,
  dock: WithDock
) {
  addEntity(dock.cp.docks, ship);
  setEntity(ship.cp.dockable, dock);
  clearEntity(ship.cp.drive);

  if (ship.cp.render) {
    ship.cp.render.hide();
  }
}

export function dockOrder(
  entity: RequireComponent<"drive" | "dockable" | "position">,
  order: DockOrder
): boolean {
  const { docks } = order.target.cp;
  const { size } = entity.cp.dockable;
  setTarget(entity.cp.drive, order.target);

  if (docks.pads[size] === 0) {
    throw new DockSizeMismatchError(size);
  }

  if (
    entity.cp.drive.targetReached &&
    availableDocks(docks, size) > docks.entities.length
  ) {
    dockShip(entity, order.target);

    return true;
  }

  return false;
}
