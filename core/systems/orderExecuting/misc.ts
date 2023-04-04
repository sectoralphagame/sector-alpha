import { waypoint } from "../../archetypes/waypoint";
import {
  clearTarget,
  defaultDriveLimit,
  setTarget,
  stop,
} from "../../components/drive";
import type { MoveAction, TeleportAction } from "../../components/orders";
import { show } from "../../components/render";
import type { RequireComponent } from "../../tsHelpers";

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
    const dock = entity.sim.entities
      .get(entity.cp.dockable.dockedIn)!
      .requireComponents(["docks"]);
    dock.cp.docks.docked = dock.cp.docks.docked.filter((e) => e !== entity.id);
    entity.cp.dockable.dockedIn = null;
    if (entity.cp.render) {
      show(entity.cp.render);
    }
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

export function attackAction(
  entity: RequireComponent<"drive" | "orders" | "damage">
): boolean {
  return entity.cp.damage.targetId
    ? !entity.sim.get(entity.cp.damage.targetId)
    : true;
}

export function teleportAction(
  entity: RequireComponent<"position" | "orders">,
  order: TeleportAction
): boolean {
  const destination = waypoint(entity.sim.getOrThrow(order.targetId));

  entity.cp.position = {
    name: "position",
    angle: entity.cp.position.angle,
    coord: destination.cp.position.coord,
    sector: destination.cp.position.sector,
    moved: true,
  };

  entity.cp.docks?.docked.forEach((docked) => {
    entity.sim.getOrThrow(docked).cp.position = {
      name: "position",
      angle: entity.cp.position.angle,
      coord: destination.cp.position.coord,
      sector: destination.cp.position.sector,
      moved: true,
    };
  });

  return true;
}

export function holdPosition() {
  return false;
}
