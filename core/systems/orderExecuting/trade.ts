import { releaseBudgetAllocation } from "@core/components/budget";
import type { TradeAction } from "../../components/orders";
import { releaseStorageAllocation, transfer } from "../../components/storage";
import { NotDockedError } from "../../errors";
import type { RequireComponent } from "../../tsHelpers";
import { acceptTrade } from "../../utils/trading";

export function trade(
  order: TradeAction,
  entity: RequireComponent<"drive" | "storage" | "dockable">,
  target: RequireComponent<
    "storage" | "trade" | "owner" | "budget" | "docks" | "journal" | "position"
  >
) {
  if (order.offer.type === "sell") {
    if (order.offer.allocations?.buyer?.storage) {
      releaseStorageAllocation(
        target.cp.storage,
        order.offer.allocations.buyer.storage
      );
    }
    if (order.offer.allocations?.seller?.storage) {
      releaseStorageAllocation(
        entity.cp.storage,
        order.offer.allocations.seller.storage
      );
    }

    transfer(entity, order.offer.commodity, order.offer.quantity, target, {
      exact: true,
      transfer: true,
    });
  } else {
    if (order.offer.allocations?.buyer?.storage) {
      releaseStorageAllocation(
        entity.cp.storage,
        order.offer.allocations.buyer.storage
      );
    }
    if (order.offer.allocations?.seller?.storage) {
      releaseStorageAllocation(
        target.cp.storage,
        order.offer.allocations.seller.storage
      );
    }
    transfer(target, order.offer.commodity, order.offer.quantity, entity, {
      exact: true,
      transfer: true,
    });
  }

  acceptTrade(target, order.offer);
}

export function tradeOrder(
  entity: RequireComponent<"drive" | "storage" | "dockable" | "journal">,
  order: TradeAction
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
      "journal",
    ]);
  if (entity.cp.dockable.dockedIn === target.id) {
    trade(order, entity, target);
    return true;
  }

  throw new NotDockedError(entity, target);
}

export function tradeActionCleanup(
  entity: RequireComponent<"drive" | "storage" | "dockable" | "journal">,
  order: TradeAction
): void {
  const target = entity.sim
    .getOrThrow(order.targetId)
    .requireComponents([
      "trade",
      "storage",
      "budget",
      "owner",
      "docks",
      "position",
      "journal",
    ]);
  const budget =
    order.offer.budget !== null
      ? entity.sim.getOrThrow(order.offer.budget).requireComponents(["budget"])
          .cp.budget
      : null;

  if (order.offer.type === "sell") {
    if (order.offer.allocations?.buyer?.storage) {
      releaseStorageAllocation(
        target.cp.storage,
        order.offer.allocations.buyer.storage
      );
    }
    if (order.offer.allocations?.seller?.storage) {
      releaseStorageAllocation(
        entity.cp.storage,
        order.offer.allocations.seller.storage
      );
    }

    if (order.offer.allocations?.buyer?.budget) {
      releaseBudgetAllocation(
        target.cp.budget,
        order.offer.allocations.buyer.budget
      );
    }
  } else {
    if (order.offer.allocations?.buyer?.storage) {
      releaseStorageAllocation(
        entity.cp.storage,
        order.offer.allocations.buyer.storage
      );
    }
    if (order.offer.allocations?.seller?.storage) {
      releaseStorageAllocation(
        target.cp.storage,
        order.offer.allocations.seller.storage
      );
    }
    if (order.offer.allocations?.buyer?.budget && budget) {
      releaseBudgetAllocation(budget, order.offer.allocations.buyer.budget);
    }
  }
}
