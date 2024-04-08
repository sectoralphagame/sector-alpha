import { teleport } from "@core/utils/moving";
import { waypoint } from "../../archetypes/waypoint";
import {
  clearTarget,
  defaultDriveLimit,
  setTarget,
  stop,
} from "../../components/drive";
import type { MoveAction, TeleportAction } from "../../components/orders";
import type { RequireComponent } from "../../tsHelpers";
import { undockShip } from "./dock";

export function moveActionCleanup(
  entity: RequireComponent<"drive" | "orders">
): void {
  clearTarget(entity.cp.drive);
  entity.cp.drive.limit = defaultDriveLimit;
}

export function moveAction(
  entity: RequireComponent<"drive" | "orders">,
  order: MoveAction
): boolean {
  setTarget(entity.cp.drive, order.targetId);
  entity.cp.drive.limit = order.onlyManeuver
    ? entity.cp.drive.maneuver
    : defaultDriveLimit;

  if (entity.cp.dockable?.dockedIn) {
    undockShip(entity.requireComponents(["drive", "position", "dockable"]));
  }

  if (order.ignoreReached) return false;

  const reached = entity.cp.drive.targetReached;

  if (reached) {
    moveActionCleanup(entity);
  }

  return reached;
}

export function holdAction(
  entity: RequireComponent<"drive" | "orders">
): boolean {
  stop(entity.cp.drive);

  return false;
}

export function teleportAction(
  entity: RequireComponent<"position" | "orders">,
  order: TeleportAction
): boolean {
  const destination = waypoint(entity.sim.getOrThrow(order.targetId));

  teleport(
    entity,
    destination.cp.position.coord,
    destination.cp.position.sector
  );

  return true;
}

export function holdPosition() {
  return false;
}
