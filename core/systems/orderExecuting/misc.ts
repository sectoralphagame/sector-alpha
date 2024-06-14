import { clearTarget, setTarget, stop, teleport } from "@core/utils/moving";
import { waypoint } from "../../archetypes/waypoint";
import { defaultDriveLimit } from "../../components/drive";
import type { MoveAction, TeleportAction } from "../../components/orders";
import type { RequireComponent } from "../../tsHelpers";
import { undockShip } from "./dock";

export function moveActionCleanup(
  entity: RequireComponent<"drive" | "movable" | "orders">
): void {
  clearTarget(entity);
  entity.cp.drive.limit = defaultDriveLimit;
}

export function moveAction(
  entity: RequireComponent<"drive" | "movable" | "orders">,
  order: MoveAction
): boolean {
  setTarget(entity, order.targetId);
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
  entity: RequireComponent<"drive" | "movable" | "orders">
): boolean {
  stop(entity);

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
