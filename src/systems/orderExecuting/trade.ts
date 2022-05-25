import { TradeOrder } from "../../components/orders";
import { releaseStorageAllocation, transfer } from "../../components/storage";
import { NotDockedError } from "../../errors";
import { RequireComponent } from "../../tsHelpers";
import { acceptTrade } from "../../utils/trading";

export function tradeOrder(
  entity: RequireComponent<"drive" | "storage" | "dockable">,
  order: TradeOrder
): boolean {
  if (entity.cp.dockable.entity === order.target) {
    if (order.offer.type === "sell") {
      if (order.offer.allocations?.buyer?.storage) {
        releaseStorageAllocation(
          order.target.cp.storage,
          order.offer.allocations.buyer.storage
        );
      }

      transfer(
        entity.cp.storage,
        order.offer.commodity,
        order.offer.quantity,
        order.target.cp.storage,
        true
      );
    } else {
      if (order.offer.allocations?.seller?.storage) {
        releaseStorageAllocation(
          order.target.cp.storage,
          order.offer.allocations.seller.storage
        );
      }
      transfer(
        order.target.cp.storage,
        order.offer.commodity,
        order.offer.quantity,
        entity.cp.storage,
        true
      );
    }

    acceptTrade(order.target, order.offer);
    return true;
  }

  throw new NotDockedError(entity, order.target);
}
