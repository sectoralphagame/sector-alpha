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
import { getSummedConsumption } from "../components/production";
import {
  hasSufficientStorage,
  hasSufficientStorageSpace,
  newStorageAllocation,
  releaseStorageAllocation,
} from "../components/storage";
import {
  newBudgetAllocation,
  releaseBudgetAllocation,
  transferMoney,
} from "../components/budget";

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
      hasSufficientStorage(entity.cp.storage, input.commodity, input.quantity)
    );
  }

  if (input.faction === entity.cp.owner.value) {
    validPrice = true;
  } else {
    validPrice = input.price <= offer.price;
  }

  return (
    validPrice &&
    entity.cp.budget.available >= input.price * input.quantity &&
    hasSufficientStorageSpace(entity.cp.storage, input.quantity)
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
      const allocation = releaseBudgetAllocation(
        entity.cp.budget,
        input.allocations.buyer.budget
      );
      transferMoney(entity.cp.budget, allocation.amount, input.budget);
    } else if (input.allocations?.buyer?.budget && input.budget) {
      const allocation = releaseBudgetAllocation(
        input.budget,
        input.allocations.buyer.budget
      );
      transferMoney(input.budget, allocation.amount, entity.cp.budget);
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
        budget: newBudgetAllocation(entity.cp.budget, {
          amount: offer.price * offer.quantity,
        }),
        storage: newStorageAllocation(entity.cp.storage, {
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
      storage: newStorageAllocation(entity.cp.storage, {
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
  const summedConsumption = getSummedConsumption(entity.cp.compoundProduction);
  const stored = entity.cp.storage.availableWares;

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
  const stored = entity.cp.storage.availableWares;

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
    "storage" | "commander" | "owner" | "orders" | "position" | "dockable"
  >,
  commodity: Commodity,
  buyer: WithTrade,
  seller: WithTrade
): boolean {
  if (!entity.sim.paths) return false;

  const sameFaction = entity.cp.owner.value === seller.components.owner.value;
  const buy = entity.cp.commander.entity === buyer;
  const commander = entity.cp.commander.entity!.requireComponents([
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
        : commander.cp.budget.available /
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
      releaseBudgetAllocation(
        buyer.components.budget,
        buyerAllocations.budget.id
      );
    }
    if (buyerAllocations.storage?.id) {
      releaseStorageAllocation(buyer.cp.storage, buyerAllocations.storage.id);
    }
    return false;
  }

  const orders: Order[] = [];

  if (entity.cp.dockable.entity !== seller) {
    orders.push(...moveToOrders(entity, seller), {
      type: "dock",
      target: seller,
    });
  }

  orders.push(
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
    { type: "dock", target: buyer },
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
    })
  );

  entity.cp.orders.value.push({
    type: "trade",
    orders,
  });

  return true;
}

export function autoBuyMostNeededByCommander(
  entity: RequireComponent<
    | "commander"
    | "storage"
    | "owner"
    | "orders"
    | "autoOrder"
    | "position"
    | "dockable"
  >,
  commodity: Commodity,
  jumps: number
): boolean {
  const minQuantity = 0;
  const commander = facility(entity.cp.commander.entity!);
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
    | "commander"
    | "storage"
    | "owner"
    | "orders"
    | "autoOrder"
    | "position"
    | "dockable"
  >,
  commodity: Commodity,
  jumps: number
): boolean {
  const minQuantity = 0;
  const commander = facility(entity.cp.commander.entity!);
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
    | "drive"
    | "commander"
    | "orders"
    | "storage"
    | "owner"
    | "position"
    | "dockable"
  >
) {
  const commander = facility(entity.cp.commander.entity!);
  const orders: Order[] = [];
  if (entity.cp.dockable.entity !== commander) {
    orders.push(...moveToOrders(entity, commander), {
      type: "dock",
      target: commander,
    });
  }
  Object.values(commodities)
    .filter((commodity) => entity.cp.storage.availableWares[commodity] > 0)
    .forEach((commodity) => {
      const offer: TransactionInput = {
        commodity,
        quantity: entity.cp.storage.availableWares[commodity],
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
  if (orders.length) {
    entity.cp.orders.value.push({
      orders,
      type: "trade",
    });
  }
}
