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
  if (order.offer.allocations.trader.storage) {
    releaseStorageAllocation(
      target.cp.storage,
      order.offer.allocations.trader.storage,
      "accepted"
    );
  }
  if (order.offer.allocations.customer.storage) {
    releaseStorageAllocation(
      entity.cp.storage,
      order.offer.allocations.customer.storage,
      "accepted"
    );
  }

  for (const item of order.offer.items) {
    if (item.type === "sell") {
      transfer(entity, item.commodity, item.quantity, target, {
        exact: true,
        transfer: true,
      });
    } else {
      transfer(target, item.commodity, item.quantity, entity, {
        exact: true,
        transfer: true,
      });
    }
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

  if (order.offer.allocations.customer.budget) {
    releaseBudgetAllocation(
      entity.sim
        .getOrThrow(order.offer.budgets.customer)
        .requireComponents(["budget"]).cp.budget,
      order.offer.allocations.customer.budget,
      "cancelled"
    );
  }
  if (order.offer.allocations.customer.storage) {
    releaseStorageAllocation(
      entity.cp.storage,
      order.offer.allocations.customer.storage,
      "cancelled"
    );
  }

  if (order.offer.allocations.trader.budget) {
    releaseBudgetAllocation(
      entity.sim
        .getOrThrow(order.offer.budgets.trader)
        .requireComponents(["budget"]).cp.budget,
      order.offer.allocations.trader.budget,
      "cancelled"
    );
  }
  if (order.offer.allocations.trader.storage) {
    releaseStorageAllocation(
      target.cp.storage,
      order.offer.allocations.trader.storage,
      "cancelled"
    );
  }
}
