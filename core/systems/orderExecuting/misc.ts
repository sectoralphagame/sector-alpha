import { marker } from "../../archetypes/marker";
import { clearTarget, setTarget, stop } from "../../components/drive";
import { MoveAction, TeleportAction } from "../../components/orders";
import { show } from "../../components/render";
import { RequireComponent } from "../../tsHelpers";

export function moveAction(
  entity: RequireComponent<"drive" | "orders">,
  order: MoveAction
): boolean {
  setTarget(entity.cp.drive, order.targetId);

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

  const reached = entity.cp.drive.targetReached;

  if (reached) {
    clearTarget(entity.cp.drive);
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
  const destination = marker(entity.sim.getOrThrow(order.targetId));

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
