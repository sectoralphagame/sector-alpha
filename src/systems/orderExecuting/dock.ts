import { availableDocks, WithDock } from "../../components/dockable";
import { clearTarget, setTarget } from "../../components/drive";
import { DockOrder } from "../../components/orders";
import { hide } from "../../components/render";
import { DockSizeMismatchError } from "../../errors";
import { RequireComponent } from "../../tsHelpers";

export function dockShip(
  ship: RequireComponent<"drive" | "dockable" | "position">,
  dock: WithDock
) {
  dock.cp.docks.docked.push(ship.id);
  ship.cp.dockable.dockedIn = dock.id;
  clearTarget(ship.cp.drive);

  if (ship.cp.render) {
    hide(ship.cp.render);
  }
}

export function dockOrder(
  entity: RequireComponent<"drive" | "dockable" | "position">,
  order: DockOrder
): boolean {
  const target = entity.sim
    .get(order.targetId)
    .requireComponents(["position", "docks"]);
  const { docks } = target.cp;
  const { size } = entity.cp.dockable;
  setTarget(entity.cp.drive, order.targetId);

  if (docks.pads[size] === 0) {
    throw new DockSizeMismatchError(size);
  }

  if (
    entity.cp.drive.targetReached &&
    availableDocks(docks, size, entity.sim) > docks.docked.length
  ) {
    dockShip(entity, target);

    return true;
  }

  return false;
}
