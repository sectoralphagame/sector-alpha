import { asteroid } from "../../archetypes/asteroid";
import { asteroidField } from "../../archetypes/asteroidField";
import { setTarget } from "../../components/drive";
import { MineOrder } from "../../components/orders";
import { getAvailableSpace } from "../../components/storage";
import { getClosestMineableAsteroid } from "../../economy/utils";
import { RequireComponent } from "../../tsHelpers";

export function mineOrder(
  entity: RequireComponent<"drive" | "mining" | "position" | "storage">,
  order: MineOrder
): boolean {
  const targetField = asteroidField(entity.sim.get(order.targetFieldId));
  const targetRock = order.targetRockId
    ? asteroid(entity.sim.get(order.targetRockId))
    : null;
  if (
    !targetRock ||
    (targetRock.cp.minable.minedById !== null &&
      targetRock.cp.minable.minedById !== entity.id)
  ) {
    const rock = getClosestMineableAsteroid(
      targetField,
      entity.cp.position.coord
    );
    if (!rock) return false;
    order.targetRockId = rock.id;
  }

  setTarget(entity.cp.drive, order.targetRockId);

  if (entity.cp.drive.targetReached) {
    const rock = asteroid(entity.sim.get(order.targetRockId));
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
