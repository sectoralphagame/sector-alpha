import { TradeOrder } from "../../components/orders";
import { releaseStorageAllocation, transfer } from "../../components/storage";
import { NotDockedError } from "../../errors";
import { RequireComponent } from "../../tsHelpers";
import { acceptTrade } from "../../utils/trading";

export function tradeOrder(
  entity: RequireComponent<"drive" | "storage" | "dockable">,
  order: TradeOrder
): boolean {
  const target = entity.sim
    .getOrThrow(order.targetId)
    .requireComponents([
      "trade",
      "storage",
      "budget",
      "owner",
      "docks",
      "position",
    ]);
  if (entity.cp.dockable.dockedIn === target.id) {
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
