import { sortBy } from "lodash";
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
  getAvailableSpace,
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

  if (offer.type === input.type && input.factionId !== entity.cp.owner.id) {
    throw new InvalidOfferType(input.type);
  }
  if (input.type === "buy") {
    if (input.factionId === entity.cp.owner.id) {
      validPrice = true;
    } else {
      validPrice = input.price >= offer.price;
    }

    return (
      validPrice &&
      hasSufficientStorage(entity.cp.storage, input.commodity, input.quantity)
    );
  }

  if (input.factionId === entity.cp.owner.id) {
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
    const budget = input.budget
      ? entity.sim.getOrThrow(input.budget).requireComponents(["budget"]).cp
          .budget
      : null;
    // They are buying from us
    if (input.type === "sell" && input.allocations?.buyer?.budget && budget) {
      const allocation = releaseBudgetAllocation(
        entity.cp.budget,
        input.allocations.buyer.budget
      );
      transferMoney(entity.cp.budget, allocation.amount, budget);
    } else if (input.allocations?.buyer?.budget && budget) {
      const allocation = releaseBudgetAllocation(
        budget,
        input.allocations.buyer.budget
      );
      transferMoney(budget, allocation.amount, entity.cp.budget);
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
    const tradeId = `${entity.id}:${offer.initiator}:${
      offer.type
    }:${entity.sim.getTime()}`;
    if (offer.type === "sell") {
      return {
        budget: newBudgetAllocation(
          entity.cp.budget,
          {
            amount: offer.price * offer.quantity,
            issued: entity.sim.getTime(),
          },
          { tradeId }
        ),
        storage: newStorageAllocation(
          entity.cp.storage,
          {
            amount: {
              ...perCommodity(() => 0),
              [offer.commodity]: offer.quantity,
            },
            issued: entity.sim.getTime(),
            type: "incoming",
          },
          { tradeId }
        ),
      };
    }

    return {
      budget: newBudgetAllocation(
        entity.sim.getOrThrow(offer.budget!).requireComponents(["budget"]).cp
          .budget,
        {
          amount: offer.price * offer.quantity,
          issued: entity.sim.getTime(),
        },
        { tradeId }
      ),
      storage: newStorageAllocation(
        entity.cp.storage,
        {
          amount: {
            ...perCommodity(() => 0),
            [offer.commodity]: offer.quantity,
          },
          issued: entity.sim.getTime(),
          type: "outgoing",
        },
        { tradeId }
      ),
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

/**
 * Arrange a series of orders "buy here and sell there"
 * @param entity Ship that moves commodity
 */
export function tradeCommodity(
  entity: RequireComponent<
    "storage" | "owner" | "orders" | "position" | "dockable"
  >,
  commodity: Commodity,
  buyer: WithTrade,
  seller: WithTrade
): boolean {
  const sameFactionAsBuyer = entity.cp.owner.id === buyer.cp.owner.id;
  const sameFactionAsSeller = entity.cp.owner.id === seller.cp.owner.id;

  const entityWithBudget = entity.sim
    .getOrThrow(
      entity.cp.commander ? entity.cp.commander.id : entity.cp.owner.id
    )
    .requireComponents(["budget"]);

  const quantity = Math.floor(
    Math.min(
      buyer.cp.trade.offers[commodity].quantity,
      getAvailableSpace(entity.cp.storage),
      seller.cp.trade.offers[commodity].quantity,
      sameFactionAsSeller
        ? Infinity
        : entityWithBudget.cp.budget.available /
            seller.cp.trade.offers[commodity].price
    )
  );

  if (quantity === 0) {
    return false;
  }

  const buyPrice = sameFactionAsSeller
    ? 0
    : seller.cp.trade.offers[commodity].price;
  const sellPrice = sameFactionAsBuyer
    ? 0
    : buyer.cp.trade.offers[commodity].price;

  if (!sameFactionAsSeller && buyPrice > entityWithBudget.cp.budget.available)
    return false;

  const offer = {
    initiator: entity.id,
    quantity,
    commodity,
    factionId: entity.cp.owner.id,
    budget: entityWithBudget.id,
    allocations: null,
  };

  // We sell, facility buys
  const offerForBuyer = {
    ...offer,
    price: sellPrice,
    type: "sell" as "sell",
  };
  const offerForSeller = {
    ...offer,
    price: buyPrice,
    type: "buy" as "buy",
  };

  if (
    offerForSeller.price * offer.quantity >
    entityWithBudget.cp.budget.available
  )
    return false;

  const buyerAllocations = allocate(buyer, offerForBuyer);
  if (!buyerAllocations) return false;

  const sellerAllocations = allocate(seller, offerForSeller);
  if (!sellerAllocations) {
    if (buyerAllocations.budget?.id) {
      releaseBudgetAllocation(buyer.cp.budget, buyerAllocations.budget.id);
    }
    if (buyerAllocations.storage?.id) {
      releaseStorageAllocation(buyer.cp.storage, buyerAllocations.storage.id);
    }
    return false;
  }

  const orders: Order[] = [];

  if (entity.cp.dockable.dockedIn !== seller.id) {
    orders.push(...moveToOrders(entity, seller), {
      type: "dock",
      targetId: seller.id,
    });
  }

  orders.push(
    tradeOrder({
      targetId: seller.id,
      offer: {
        ...offerForSeller,
        allocations: {
          buyer: {
            budget: sellerAllocations.budget?.id ?? null,
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
    { type: "dock", targetId: buyer.id },
    tradeOrder({
      targetId: buyer.id,
      offer: {
        ...offerForBuyer,
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
  const commander = facility(entity.sim.getOrThrow(entity.cp.commander.id));
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
  const commander = facility(entity.sim.getOrThrow(entity.cp.commander.id));
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
  const commander = facility(entity.sim.getOrThrow(entity.cp.commander.id));
  const orders: Order[] = [];
  if (entity.cp.dockable.dockedIn !== commander.id) {
    orders.push(...moveToOrders(entity, commander), {
      type: "dock",
      targetId: commander.id,
    });
  }
  Object.values(commodities)
    .filter((commodity) => entity.cp.storage.availableWares[commodity] > 0)
    .forEach((commodity) => {
      const offer: TransactionInput = {
        commodity,
        initiator: entity.id,
        quantity: entity.cp.storage.availableWares[commodity],
        price: 0,
        budget: null,
        allocations: null,
        type: "sell",
        factionId: entity.cp.owner.id,
      };
      const allocations = allocate(commander, offer);
      if (allocations) {
        orders.push(
          tradeOrder(
            merge(
              {
                targetId: commander.id,
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
