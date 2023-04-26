import type { WithDock } from "../../components/dockable";
import { availableDocks } from "../../components/dockable";
import { clearTarget, setTarget } from "../../components/drive";
import type { DockAction } from "../../components/orders";
import { hide, show } from "../../components/render";
import { DockSizeMismatchError } from "../../errors";
import type { RequireComponent } from "../../tsHelpers";

export function dockShip(
  ship: RequireComponent<"drive" | "dockable" | "position">,
  dock: WithDock
) {
  dock.cp.docks.docked.push(ship.id);
  ship.cp.dockable.dockedIn = dock.id;
  ship.cp.drive.active = false;
  clearTarget(ship.cp.drive);

  if (ship.cp.render) {
    hide(ship.cp.render);
  }
}

export function undockShip(
  ship: RequireComponent<"drive" | "dockable" | "position">
) {
  const dock = ship.sim
    .getOrThrow(ship.cp.dockable.dockedIn!)
    .requireComponents(["docks"]);
  dock.cp.docks.docked = dock.cp.docks.docked.filter((e) => e !== ship.id);
  ship.cp.dockable.dockedIn = null;
  ship.cp.drive.active = true;

  if (ship.cp.render) {
    show(ship.cp.render);
  }
}

export function dockOrder(
  entity: RequireComponent<"drive" | "dockable" | "position">,
  order: DockAction
): boolean {
  const target = entity.sim
    .getOrThrow(order.targetId)
    .requireComponents(["position", "docks"]);
  const { docks } = target.cp;
  const { size } = entity.cp.dockable;
  setTarget(entity.cp.drive, order.targetId);

  if (docks.pads[size] === 0) {
    throw new DockSizeMismatchError(size);
  }

  if (
    entity.cp.drive.targetReached &&
    availableDocks(docks, size, entity.sim) > 0
  ) {
    dockShip(entity, target);

    return true;
  }

  return false;
}
