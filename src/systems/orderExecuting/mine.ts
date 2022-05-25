import { setTarget } from "../../components/drive";
import { MineOrder } from "../../components/orders";
import { getAvailableSpace } from "../../components/storage";
import { clearEntity, setEntity } from "../../components/utils/entityId";
import { getClosestMineableAsteroid } from "../../economy/utils";
import { RequireComponent } from "../../tsHelpers";

export function mineOrder(
  entity: RequireComponent<"drive" | "mining" | "position" | "storage">,
  order: MineOrder
): boolean {
  if (
    !order.targetRock ||
    (order.targetRock.cp.minable.entity !== null &&
      order.targetRock.cp.minable.entity !== entity)
  ) {
    const rock = getClosestMineableAsteroid(
      order.target,
      entity.cp.position.coord
    );
    if (!rock) return false;
    order.targetRock = rock;
  }

  setTarget(entity.cp.drive, order.targetRock);

  if (entity.cp.drive.targetReached) {
    setEntity(entity.cp.mining, order.targetRock);
    setEntity(order.targetRock.cp.minable, entity);

    if (getAvailableSpace(entity.cp.storage) === 0) {
      clearEntity(entity.cp.mining);
      clearEntity(order.targetRock.cp.minable);

      return true;
    }
  }

  return false;
}
