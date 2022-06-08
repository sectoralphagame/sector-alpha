import { marker } from "../../archetypes/marker";
import { clearTarget, setTarget } from "../../components/drive";
import { MoveOrder, TeleportOrder } from "../../components/orders";
import { show } from "../../components/render";
import { RequireComponent } from "../../tsHelpers";

export function moveOrder(
  entity: RequireComponent<"drive" | "orders">,
  order: MoveOrder
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

export function teleportOrder(
  entity: RequireComponent<"position" | "orders">,
  order: TeleportOrder
): boolean {
  const destination = marker(entity.sim.get(order.targetId));

  entity.cp.position = {
    name: "position",
    angle: entity.cp.position.angle,
    coord: destination.cp.position.coord,
    sector: destination.cp.position.sector,
  };

  entity.cp.docks?.docked.forEach((docked) => {
    entity.sim.get(docked).cp.position = {
      name: "position",
      angle: entity.cp.position.angle,
      coord: destination.cp.position.coord,
      sector: destination.cp.position.sector,
    };
  });

  return true;
}

export function holdPosition() {
  return false;
}
