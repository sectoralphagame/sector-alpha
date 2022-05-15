import { TradeOrder } from "../../components/orders";
import { NotDockedError } from "../../errors";
import { RequireComponent } from "../../tsHelpers";
import { acceptTrade } from "../../utils/trading";

export function tradeOrder(
  entity: RequireComponent<"drive" | "storage" | "dockable">,
  order: TradeOrder
): boolean {
  if (entity.cp.dockable.docked === order.target) {
    if (order.offer.type === "sell") {
      if (order.offer.allocations?.buyer?.storage) {
        order.target.cp.storage.allocationManager.release(
          order.offer.allocations.buyer.storage
        );
      }

      entity.cp.storage.transfer(
        order.offer.commodity,
        order.offer.quantity,
        order.target.cp.storage,
        true
      );
    } else {
      if (order.offer.allocations?.seller?.storage) {
        order.target.cp.storage.allocationManager.release(
          order.offer.allocations.seller.storage
        );
      }
      order.target.cp.storage.transfer(
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
