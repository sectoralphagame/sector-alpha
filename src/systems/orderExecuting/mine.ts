import { MineOrder } from "../../components/orders";
import { getClosestMineableAsteroid } from "../../economy/utils";
import { RequireComponent } from "../../tsHelpers";

export function mineOrder(
  entity: RequireComponent<"drive" | "mining" | "position" | "storage">,
  order: MineOrder
): boolean {
  if (
    !order.targetRock ||
    (order.targetRock.cp.minable.minedBy !== null &&
      order.targetRock.cp.minable.minedBy !== entity)
  ) {
    const rock = getClosestMineableAsteroid(
      order.target,
      entity.cp.position.coord
    );
    if (!rock) return false;
    order.targetRock = rock;
  }

  entity.cp.drive.setTarget(order.targetRock);

  if (entity.cp.drive.targetReached) {
    entity.cp.mining.asteroid = order.targetRock;
    order.targetRock.cp.minable.setMinedBy(entity);

    if (entity.cp.storage.getAvailableSpace() === 0) {
      entity.cp.mining.clearAsteroid();
      order.targetRock.cp.minable.clearMinedBy();
      return true;
    }
  }

  return false;
}
