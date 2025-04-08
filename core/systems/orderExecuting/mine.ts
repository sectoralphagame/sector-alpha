import { asteroidField } from "../../archetypes/asteroidField";
import type { MineAction } from "../../components/orders";
import { getAvailableSpace } from "../../components/storage";
import type { RequireComponent } from "../../tsHelpers";
import { stop } from "../../utils/moving";

export function mineAction(
  entity: RequireComponent<
    "drive" | "mining" | "movable" | "position" | "storage"
  >,
  order: MineAction
): boolean {
  const targetField = asteroidField(entity.sim.getOrThrow(order.targetFieldId));
  // entity.cp.orders!.value[0].actions.unshift(...moveToActions(entity, rock));

  if (entity.cp.drive.targetReached) {
    stop(entity);
    entity.cp.drive.active = true;
    entity.cp.drive.limit = Math.min(entity.cp.drive.maneuver, 0.05);

    entity.cp.mining.entityId = order.targetFieldId;
    entity.cp.mining.resource = order.resource;

    if (!targetField.cp.mineable.mountPoints.used.includes(entity.id)) {
      targetField.cp.mineable.mountPoints.used.push(entity.id);
    }

    if (getAvailableSpace(entity.cp.storage) === 0) {
      entity.cp.mining.entityId = null;
      targetField.cp.mineable.mountPoints.used =
        targetField.cp.mineable.mountPoints.used.filter(
          (id) => id !== entity.id
        );

      return true;
    }
  }

  return false;
}
