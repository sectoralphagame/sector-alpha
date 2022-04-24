import { sortBy } from "lodash";
import { Entity } from "../components/entity";
import { TransactionInput } from "../components/trade";
import { Allocation } from "../components/utils/allocations";
import { commodities, Commodity } from "../economy/commodity";
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

export function getNeededCommodities(entity: Entity): Commodity[] {
  const summedConsumption = entity.cp.compoundProduction.getSummedConsumption();
  const stored = entity.cp.storage.getAvailableWares();

  const scores = sortBy(
    Object.values(commodities)
      .filter(
        (commodity) =>
          entity.cp.trade.offers[commodity].type === "buy" &&
          entity.cp.trade.offers[commodity].quantity > 0
      )
      .map((commodity) => ({
        commodity,
        wantToBuy: entity.cp.trade.offers[commodity].quantity,
        quantityStored: stored[commodity],
      }))
      .map((data) => ({
        commodity: data.commodity,
        score:
          (data.quantityStored -
            entity.cp.compoundProduction.pac[data.commodity].consumes) /
          summedConsumption,
      })),
    "score"
  );

  return scores.map((offer) => offer.commodity);
}

export function getCommoditiesForSell(entity: Entity): Commodity[] {
  const stored = entity.cp.storage.getAvailableWares();

  return sortBy(
    Object.values(commodities)
      .map((commodity) => ({
        commodity,
        wantToSell:
          entity.cp.trade.offers[commodity].type === "sell"
            ? entity.cp.trade.offers[commodity].quantity
            : 0,
        quantityStored: stored[commodity],
      }))
      .filter((offer) => offer.wantToSell > 0)
      .map((data) => ({
        commodity: data.commodity,
        score: data.quantityStored,
      })),
    "score"
  ).map((offer) => offer.commodity);
}
