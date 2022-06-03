import { clearTarget, setTarget } from "../../components/drive";
import { MoveOrder, TeleportOrder } from "../../components/orders";
import { show } from "../../components/render";
import { getEntity, setEntities } from "../../components/utils/entityId";
import { RequireComponent } from "../../tsHelpers";

export function moveOrder(
  entity: RequireComponent<"drive" | "orders">,
  order: MoveOrder
): boolean {
  setTarget(entity.cp.drive, getEntity(order.position, entity.sim));

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
  const marker = getEntity(order.position, entity.sim);

  entity.cp.position = {
    name: "position",
    angle: entity.cp.position.angle,
    coord: marker.cp.position.coord,
    entity: marker.cp.position.entity,
    entityId: marker.cp.position.entity.id,
  };

  entity.cp.docks?.entities.forEach((docked) => {
    docked.cp.position = {
      name: "position",
      angle: entity.cp.position.angle,
      coord: marker.cp.position.coord,
      entity: marker.cp.position.entity,
      entityId: marker.cp.position.entity.id,
    };
  });

  return true;
}

export function holdPosition() {
  return false;
}
