import { clearTarget, setTarget } from "../../components/drive";
import { MoveOrder, TeleportOrder } from "../../components/orders";
import { show } from "../../components/render";
import { setEntities } from "../../components/utils/entityId";
import { RequireComponent } from "../../tsHelpers";

export function moveOrder(
  entity: RequireComponent<"drive" | "orders">,
  order: MoveOrder
): boolean {
  setTarget(entity.cp.drive, order.position);

  if (entity.cp.dockable?.entity) {
    setEntities(
      entity.cp.dockable.entity.cp.docks,
      entity.cp.dockable.entity.cp.docks.entities.filter(
        (e) => e.id !== entity.id
      )
    );
    entity.cp.dockable.entity = null;
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
  entity.cp.position = {
    name: "position",
    angle: entity.cp.position.angle,
    coord: order.position.cp.position.coord,
    entity: order.position.cp.position.entity,
    entityId: order.position.cp.position.entity.id,
  };

  entity.cp.docks?.entities.forEach((docked) => {
    docked.cp.position = {
      name: "position",
      angle: entity.cp.position.angle,
      coord: order.position.cp.position.coord,
      entity: order.position.cp.position.entity,
      entityId: order.position.cp.position.entity.id,
    };
  });

  return true;
}

export function holdPosition() {
  return false;
}
