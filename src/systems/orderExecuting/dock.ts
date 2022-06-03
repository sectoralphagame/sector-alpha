import { availableDocks, WithDock } from "../../components/dockable";
import { setTarget } from "../../components/drive";
import { DockOrder } from "../../components/orders";
import { hide } from "../../components/render";
import {
  addEntity,
  clearEntity,
  getEntity,
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
    hide(ship.cp.render);
  }
}

export function dockOrder(
  entity: RequireComponent<"drive" | "dockable" | "position">,
  order: DockOrder
): boolean {
  const target = getEntity(order.target, entity.sim);
  const { docks } = target.cp;
  const { size } = entity.cp.dockable;
  setTarget(entity.cp.drive, target);

  if (docks.pads[size] === 0) {
    throw new DockSizeMismatchError(size);
  }

  if (
    entity.cp.drive.targetReached &&
    availableDocks(docks, size) > docks.entities.length
  ) {
    dockShip(entity, target);

    return true;
  }

  return false;
}
