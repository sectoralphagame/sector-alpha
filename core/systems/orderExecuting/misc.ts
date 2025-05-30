import { clearTarget, setTarget, stop, teleport } from "@core/utils/moving";
import { HideReason } from "@core/components/render";
import { waypoint } from "../../archetypes/waypoint";
import { defaultDriveLimit } from "../../components/drive";
import type {
  MoveAction,
  TeleportAction,
  UndockAction,
} from "../../components/orders";
import type { RequireComponent } from "../../tsHelpers";
import { undockShip } from "./dock";
import { DisposableUnregisteringSystem } from "../disposableUnregistering";

export function moveActionCleanup(
  entity: RequireComponent<"drive" | "movable" | "orders">
): void {
  clearTarget(entity);
  entity.cp.drive.limit = defaultDriveLimit;
}

export function moveAction(
  entity: RequireComponent<"drive" | "movable" | "orders" | "position">,
  order: MoveAction
): boolean {
  const target = waypoint(entity.sim.getOrThrow(order.targetId));
  const isTargetReached =
    entity.cp.position.sector === target.cp.position.sector &&
    entity.cp.position.coord.distance(target.cp.position.coord) <=
      entity.cp.drive.minimalDistance;

  if (isTargetReached) {
    moveActionCleanup(entity);
    if (target.hasTags(["virtual"]) && target.hasComponents(["disposable"])) {
      DisposableUnregisteringSystem.dispose(target);
    }
    return true;
  }

  setTarget(entity, order.targetId);
  entity.cp.drive.limit = order.onlyManeuver
    ? entity.cp.drive.maneuver
    : defaultDriveLimit;

  if (entity.cp.dockable?.dockedIn) {
    entity.cp.orders.value[0].actions.unshift({
      type: "undock",
    });
  }

  return false;
}

export function undockAction(
  entity: RequireComponent<
    "drive" | "dockable" | "movable" | "orders" | "position" | "render"
  >,
  _order: UndockAction
): boolean {
  // FIXME: This is a workaround for the issue with pirate ships undocking from
  // aparently nowhere
  if (!entity.cp.dockable?.dockedIn) return true;

  entity.cp.dockable.undocking = true;
  entity.cp.drive.active = true;
  entity.cp.drive.target = null;
  if (entity.cp.render) {
    entity.cp.render.hidden &= ~HideReason.Docked;
  }
  entity.cp.movable.velocity
    .set(Math.cos(entity.cp.position.angle), Math.sin(entity.cp.position.angle))
    .multiply(entity.cp.drive.maneuver);
  const facility = entity.sim
    .getOrThrow(entity.cp.dockable!.dockedIn!)
    .requireComponents(["position"]);
  entity.cp.position.angle = facility.cp.position.angle + Math.PI;
  const undocked =
    entity.cp.position.coord.distance(facility.cp.position.coord) > 0.4;

  if (undocked) {
    undockShip(entity);
  }

  return undocked;
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
