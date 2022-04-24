import { Entity } from "../components/entity";
import { TransactionInput } from "../components/trade";
import { Allocation } from "../components/utils/allocations";
import { InvalidOfferType, NonPositiveAmount } from "../errors";
import { perCommodity } from "./perCommodity";

export function isTradeAccepted(
  entity: Entity,
  input: TransactionInput
): boolean {
  let validPrice = false;

  const offer = entity.cp.trade.offers[input.commodity];

  if (offer.price < 0) {
    throw new NonPositiveAmount(offer.price);
  }

  if (offer.type === input.type && input.faction !== entity.cp.owner.value) {
    throw new InvalidOfferType(input.type);
  }
  if (input.type === "buy") {
    if (input.faction === entity.cp.owner.value) {
      validPrice = true;
    } else {
      validPrice = input.price >= offer.price;
    }

    return (
      validPrice &&
      entity.cp.storage.hasSufficientStorage(input.commodity, input.quantity)
    );
  }

  if (input.faction === entity.cp.owner.value) {
    validPrice = true;
  } else {
    validPrice = input.price <= offer.price;
  }

  return (
    validPrice &&
    entity.cp.budget.getAvailableMoney() >= input.price * input.quantity &&
    entity.cp.storage.hasSufficientStorageSpace(input.quantity)
  );
}

const maxTransactions = 100;
export function acceptTrade(entity: Entity, input: TransactionInput) {
  if (input.price > 0) {
    // They are selling us
    if (input.type === "sell") {
      const allocation = entity.cp.budget.allocations.release(
        input.allocations.buyer.budget
      );
      entity.cp.budget.transferMoney(allocation.amount, input.budget);
    } else {
      const allocation = input.budget.allocations.release(
        input.allocations.buyer.budget
      );
      input.budget.transferMoney(allocation.amount, entity.cp.budget);
    }
  }

  entity.cp.trade.transactions.push({
    ...input,
    time: entity.sim.getTime(),
  });
  if (entity.cp.trade.transactions.length > maxTransactions) {
    entity.cp.trade.transactions.shift();
  }
}

/**
 * Allocates resources necessary to finish trade before it is actually done
 */
export function allocate(
  entity: Entity,
  offer: TransactionInput
): Record<"budget" | "storage", Allocation> | null {
  if (isTradeAccepted(entity, offer)) {
    if (offer.type === "sell") {
      return {
        budget: entity.cp.budget.allocations.new({
          amount: offer.price * offer.quantity,
        }),
        storage: entity.cp.storage.allocationManager.new({
          amount: {
            ...perCommodity(() => 0),
            [offer.commodity]: offer.quantity,
          },
          type: "incoming",
        }),
      };
    }

    return {
      budget: null,
      storage: entity.cp.storage.allocationManager.new({
        amount: {
          ...perCommodity(() => 0),
          [offer.commodity]: offer.quantity,
        },
        type: "outgoing",
      }),
    };
  }

  return null;
}
