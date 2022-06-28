import { asteroid } from "../../archetypes/asteroid";
import { asteroidField } from "../../archetypes/asteroidField";
import { MineOrder } from "../../components/orders";
import { getAvailableSpace } from "../../components/storage";
import { getMineableAsteroid } from "../../economy/utils";
import { RequireComponent } from "../../tsHelpers";
import { moveToOrders } from "../../utils/moving";

export function mineOrder(
  entity: RequireComponent<"drive" | "mining" | "position" | "storage">,
  order: MineOrder
): boolean {
  const targetField = asteroidField(entity.sim.getOrThrow(order.targetFieldId));
  const targetRock = order.targetRockId
    ? entity.sim.get(order.targetRockId)
    : null;

  if (
    !targetRock ||
    (targetRock.cp.minable!.minedById !== null &&
      targetRock.cp.minable!.minedById !== entity.id)
  ) {
    const rock = getMineableAsteroid(targetField);
    if (!rock) {
      return true;
    }
    order.targetRockId = rock.id;
    entity.cp.orders!.value[0].orders.unshift(...moveToOrders(entity, rock));
  }

  if (entity.cp.drive.targetReached) {
    const rock = asteroid(entity.sim.getOrThrow(order.targetRockId!));
    entity.cp.mining.entityId = order.targetRockId;
    rock.cp.minable.minedById = entity.id;

    if (getAvailableSpace(entity.cp.storage) === 0) {
      entity.cp.mining.entityId = null;
      rock.cp.minable.minedById = null;

      return true;
    }
  }

  return false;
}
