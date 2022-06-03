import { setTarget } from "../../components/drive";
import { MineOrder } from "../../components/orders";
import { getAvailableSpace } from "../../components/storage";
import {
  clearEntity,
  getEntity,
  setEntity,
} from "../../components/utils/entityId";
import { getClosestMineableAsteroid } from "../../economy/utils";
import { RequireComponent } from "../../tsHelpers";

export function mineOrder(
  entity: RequireComponent<"drive" | "mining" | "position" | "storage">,
  order: MineOrder
): boolean {
  const target = getEntity(order.target, entity.sim);
  const targetRock = order.targetRock
    ? getEntity(order.targetRock, entity.sim)
    : null;
  if (
    !targetRock ||
    (targetRock.cp.minable.entity !== null &&
      targetRock.cp.minable.entity !== entity)
  ) {
    const rock = getClosestMineableAsteroid(target, entity.cp.position.coord);
    if (!rock) return false;
    setEntity(order.targetRock, rock);
  }

  setTarget(entity.cp.drive, order.targetRock.entity);

  if (entity.cp.drive.targetReached) {
    setEntity(entity.cp.mining, order.targetRock.entity!);
    setEntity(order.targetRock.entity!.cp.minable, entity);

    if (getAvailableSpace(entity.cp.storage) === 0) {
      clearEntity(entity.cp.mining);
      clearEntity(order.targetRock.entity!.cp.minable);

      return true;
    }
  }

  return false;
}
