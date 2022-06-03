import { TradeOrder } from "../../components/orders";
import { releaseStorageAllocation, transfer } from "../../components/storage";
import { getEntity } from "../../components/utils/entityId";
import { NotDockedError } from "../../errors";
import { RequireComponent } from "../../tsHelpers";
import { acceptTrade } from "../../utils/trading";

export function tradeOrder(
  entity: RequireComponent<"drive" | "storage" | "dockable">,
  order: TradeOrder
): boolean {
  const target = getEntity(order.target, entity.sim);
  if (entity.cp.dockable.entity === target) {
    if (order.offer.type === "sell") {
      if (order.offer.allocations?.buyer?.storage) {
        releaseStorageAllocation(
          target.cp.storage,
          order.offer.allocations.buyer.storage
        );
      }

      transfer(
        entity.cp.storage,
        order.offer.commodity,
        order.offer.quantity,
        target.cp.storage,
        true
      );
    } else {
      if (order.offer.allocations?.seller?.storage) {
        releaseStorageAllocation(
          target.cp.storage,
          order.offer.allocations.seller.storage
        );
      }
      transfer(
        target.cp.storage,
        order.offer.commodity,
        order.offer.quantity,
        entity.cp.storage,
        true
      );
    }

    acceptTrade(target, order.offer);
    return true;
  }

  throw new NotDockedError(entity, target);
}
