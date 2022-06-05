import { sortBy } from "lodash";
import { min } from "mathjs";
import merge from "lodash/merge";
import { facility } from "../archetypes/facility";
import { Order, tradeOrder } from "../components/orders";
import type { TransactionInput } from "../components/trade";
import { Allocation } from "../components/utils/allocations";
import { commodities, Commodity } from "../economy/commodity";
import { getFacilityWithMostProfit, WithTrade } from "../economy/utils";
import { InvalidOfferType, NonPositiveAmount } from "../errors";
import type { RequireComponent } from "../tsHelpers";
import { perCommodity } from "./perCommodity";
import { createOffers } from "../systems/trading";
import { moveToOrders } from "./moving";

export function isTradeAccepted(
  entity: WithTrade,
  input: Omit<TransactionInput, "allocations">
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
export function acceptTrade(entity: WithTrade, input: TransactionInput) {
  if (input.price > 0) {
    // They are selling us
    if (
      input.type === "sell" &&
      input.allocations?.buyer?.budget &&
      input.budget
    ) {
      const allocation = entity.cp.budget.allocations.release(
        input.allocations.buyer.budget
      );
      entity.cp.budget.transferMoney(allocation.amount, input.budget);
    } else if (input.allocations?.buyer?.budget && input.budget) {
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
  createOffers(entity);
}

/**
 * Allocates resources necessary to finish trade before it is actually done
 */
export function allocate(
  entity: WithTrade,
  offer: Omit<TransactionInput, "allocations">
): Record<"budget" | "storage", Allocation | null> | null {
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

export function getNeededCommodities(
  entity: WithTrade & RequireComponent<"compoundProduction">
): Commodity[] {
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

export function getCommoditiesForSell(entity: WithTrade): Commodity[] {
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

export function tradeCommodity(
  entity: RequireComponent<
    "storage" | "commander" | "owner" | "orders" | "position"
  >,
  commodity: Commodity,
  buyer: WithTrade,
  seller: WithTrade
): boolean {
  if (!entity.sim.paths) return false;

  const sameFaction = entity.cp.owner.value === seller.components.owner.value;
  const buy = entity.cp.commander.value === buyer;
  const commander = entity.cp.commander.value.requireComponents([
    "budget",
    "trade",
  ]);

  const quantity = Math.floor(
    min(
      buyer.components.trade.offers[commodity].quantity,
      entity.cp.storage.max,
      seller.components.trade.offers[commodity].quantity,
      sameFaction
        ? Infinity
        : commander.cp.budget.getAvailableMoney() /
            commander.cp.trade.offers[commodity].price
    )
  );

  if (quantity === 0) {
    return false;
  }

  const price = sameFaction
    ? 0
    : seller.components.trade.offers[commodity].price;

  const offer = {
    price,
    quantity,
    commodity,
    faction: entity.cp.owner.value!,
    budget: commander.cp.budget,
    allocations: null,
    type: "buy" as "buy",
  };

  const buyerAllocations = allocate(buyer, {
    ...offer,
    type: "sell",
  });
  if (!buyerAllocations) return false;

  const sellerAllocations = allocate(seller, offer);
  if (!sellerAllocations) {
    if (buyerAllocations.budget?.id) {
      buyer.components.budget.allocations.release(buyerAllocations.budget.id);
    }
    if (buyerAllocations.storage?.id) {
      buyer.cp.storage.allocationManager.release(buyerAllocations.storage.id);
    }
    return false;
  }

  entity.cp.orders.value.push({
    type: "trade",
    orders: [
      ...moveToOrders(entity, seller),
      tradeOrder({
        target: seller,
        offer: {
          ...offer,
          price: buy ? price : 0,
          allocations: {
            buyer: {
              budget: buyerAllocations.budget?.id ?? null,
              storage: null,
            },
            seller: {
              budget: null,
              storage: sellerAllocations.storage?.id ?? null,
            },
          },
          type: "buy",
        },
      }),
      ...moveToOrders(seller, buyer),
      tradeOrder({
        target: buyer,
        offer: {
          ...offer,
          price: buy ? 0 : price,
          allocations: {
            buyer: {
              budget: buyerAllocations.budget?.id ?? null,
              storage: buyerAllocations.storage?.id ?? null,
            },
            seller: { budget: null, storage: null },
          },
          type: "sell",
        },
      }),
    ],
  });

  return true;
}

export function autoBuyMostNeededByCommander(
  entity: RequireComponent<
    "commander" | "storage" | "owner" | "orders" | "autoOrder" | "position"
  >,
  commodity: Commodity,
  jumps: number
): boolean {
  const minQuantity = 0;
  const commander = facility(entity.cp.commander.value);
  if (commander.cp.trade.offers[commodity].quantity < minQuantity) return false;

  const target = getFacilityWithMostProfit(
    commander,
    commodity,
    minQuantity,
    jumps
  );

  if (!target) return false;

  return tradeCommodity(entity, commodity, commander, target);
}

export function autoSellMostRedundantToCommander(
  entity: RequireComponent<
    "commander" | "storage" | "owner" | "orders" | "autoOrder" | "position"
  >,
  commodity: Commodity,
  jumps: number
): boolean {
  const minQuantity = 0;
  const commander = facility(entity.cp.commander.value);
  if (commander.cp.trade.offers[commodity].quantity < minQuantity) return false;

  const target = getFacilityWithMostProfit(
    commander,
    commodity,
    minQuantity,
    jumps
  );

  if (!target) return false;

  return tradeCommodity(entity, commodity, target, commander);
}

export function returnToFacility(
  entity: RequireComponent<
    "drive" | "commander" | "orders" | "storage" | "owner" | "position"
  >
) {
  const commander = facility(entity.cp.commander.value);
  const orders: Order[] = moveToOrders(entity, commander);
  Object.values(commodities)
    .filter((commodity) => entity.cp.storage.getAvailableWares()[commodity] > 0)
    .forEach((commodity) => {
      const offer: TransactionInput = {
        commodity,
        quantity: entity.cp.storage.getAvailableWares()[commodity],
        price: 0,
        budget: null,
        allocations: null,
        type: "sell",
        faction: entity.cp.owner.value!,
      };
      const allocations = allocate(commander, offer);

      if (allocations) {
        orders.push(
          tradeOrder(
            merge(
              {
                target: commander,
                offer,
              },
              {
                offer: {
                  allocations: {
                    buyer: {
                      storage: allocations.storage?.id,
                    },
                  },
                },
              }
            )
          )
        );
      }
    });
  entity.cp.orders.value.push({
    orders,
    type: "trade",
  });
}
