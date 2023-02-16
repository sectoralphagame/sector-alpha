import merge from "lodash/merge";
import { mean } from "mathjs";
import { filter, map, pipe, sortBy, toArray } from "@fxts/core";
import { facilityComponents } from "../archetypes/facility";
import { Action, tradeAction, TradeAction } from "../components/orders";
import type { TransactionInput } from "../components/trade";
import { Allocation } from "../components/utils/allocations";
import { commoditiesArray, Commodity } from "../economy/commodity";
import { getFacilityWithMostProfit, WithTrade } from "../economy/utils";
import {
  ExceededOfferQuantity,
  InvalidOfferType,
  NonPositiveAmount,
} from "../errors";
import type { RequireComponent } from "../tsHelpers";
import { perCommodity } from "./perCommodity";
import { moveToActions } from "./moving";
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
import { Sector } from "../archetypes/sector";
import { SectorPriceStats } from "../components/sectorStats";
import { limitMax } from "./limit";
import { Marker } from "../archetypes/marker";

const tradingCommanderComponents = [
  "budget",
  "docks",
  "name",
  "position",
  "journal",
  "selection",
  "storage",
  "trade",
  "owner",
] as const;

export function isTradeAccepted(
  entity: WithTrade,
  input: Omit<TransactionInput, "allocations">
): boolean {
  let validPrice = false;

  const offer = entity.cp.trade.offers[input.commodity];

  if (offer.price < 0) {
    throw new NonPositiveAmount(offer.price);
  }

  if (offer.type === input.type) {
    throw new InvalidOfferType(input.type);
  }

  if (offer.quantity < input.quantity) {
    throw new ExceededOfferQuantity(input.quantity, offer.quantity);
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

  const result =
    validPrice &&
    entity.cp.budget.available >= input.price * input.quantity &&
    hasSufficientStorageSpace(entity.cp.storage, input.quantity);

  return result;
}

export function acceptTrade(
  entityWithOffer: WithTrade,
  input: TransactionInput
) {
  if (input.price > 0) {
    const budget = input.budget
      ? entityWithOffer.sim
          .getOrThrow(input.budget)
          .requireComponents(["budget"]).cp.budget
      : null;
    // They are buying from us
    if (input.type === "sell" && input.allocations?.buyer?.budget && budget) {
      const allocation = releaseBudgetAllocation(
        entityWithOffer.cp.budget,
        input.allocations.buyer.budget
      );
      transferMoney(entityWithOffer.cp.budget, allocation.amount, budget);
    } else if (input.allocations?.buyer?.budget && budget) {
      const allocation = releaseBudgetAllocation(
        budget,
        input.allocations.buyer.budget
      );
      transferMoney(budget, allocation.amount, entityWithOffer.cp.budget);
    }
  }

  if (entityWithOffer.cp.owner.id !== input.factionId) {
    const initiator = entityWithOffer.sim
      .getOrThrow(input.initiator)
      .requireComponents(["name", "journal"]);

    entityWithOffer.cp.journal.entries.push({
      type: "trade",
      action: input.type === "buy" ? "sell" : "buy",
      commodity: input.commodity,
      quantity: input.quantity,
      price: input.price,
      target: initiator.cp.name.value,
      time: entityWithOffer.sim.getTime(),
    });
    initiator.cp.journal.entries.push({
      type: "trade",
      action: input.type,
      commodity: input.commodity,
      quantity: input.quantity,
      price: input.price,
      target: entityWithOffer.requireComponents(["name"]).cp.name.value,
      time: entityWithOffer.sim.getTime(),
    });
  }
}

/**
 * Allocates resources necessary to finish trade before it is actually done
 */
export function allocate(
  entity: WithTrade,
  offer: Omit<TransactionInput, "allocations">
): { budget: Allocation | null; storage: Allocation } | null {
  if (isTradeAccepted(entity, offer)) {
    entity.cp.trade.offers[offer.commodity].quantity -= offer.quantity;

    const tradeId = `${entity.id}:${offer.initiator}:${
      offer.type
    }:${entity.sim.getTime()}`;

    if (offer.type === "sell") {
      return {
        budget:
          offer.price === 0
            ? null
            : newBudgetAllocation(
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
      budget:
        offer.price === 0
          ? null
          : newBudgetAllocation(
              entity.sim.getOrThrow(offer.budget!).requireComponents(["budget"])
                .cp.budget,
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

export function getNeededCommodities(entity: WithTrade): Commodity[] {
  const stored = entity.cp.storage.availableWares;

  return sortBy(
    (c) => c.score,
    pipe(
      commoditiesArray,
      filter(
        (commodity) =>
          entity.cp.trade.offers[commodity].type === "buy" &&
          entity.cp.trade.offers[commodity].quantity > 0
      ),
      map((commodity) => ({
        commodity,
        wantToBuy: entity.cp.trade.offers[commodity].quantity,
        quantityStored: stored[commodity],
      })),
      map((data) => ({
        commodity: data.commodity,
        score: data.quantityStored,
      }))
    )
  ).map((offer) => offer.commodity);
}

export function getCommoditiesForSell(entity: WithTrade): Commodity[] {
  const stored = entity.cp.storage.availableWares;

  return sortBy(
    (c) => c.score,
    pipe(
      commoditiesArray,
      filter(
        (commodity) =>
          entity.cp.trade.offers[commodity].type === "sell" &&
          entity.cp.trade.offers[commodity].quantity > 0
      ),
      map((commodity) => ({
        commodity,
        quantityStored: stored[commodity],
      })),
      map((data) => ({
        commodity: data.commodity,
        score: data.quantityStored,
      }))
    )
  ).map((offer) => offer.commodity);
}

/**
 * Arrange a series of orders "go and buy or sell there"
 * @param entity Ship that initiates trade
 */
export function tradeCommodity(
  entity: RequireComponent<
    "storage" | "owner" | "orders" | "position" | "dockable"
  >,
  offer: TransactionInput,
  target: WithTrade,
  position?: Marker
): Action[] | null {
  const allocations = allocate(target, offer);
  if (!allocations) {
    return null;
  }

  return [
    ...moveToActions(position ?? entity, target),
    {
      type: "dock",
      targetId: target.id,
    },
    tradeAction({
      targetId: target.id,
      offer: {
        ...offer,
        allocations:
          offer.type === "buy"
            ? {
                buyer: {
                  budget: allocations.budget?.id ?? null,
                  storage: null,
                },
                seller: {
                  budget: null,
                  storage: allocations.storage?.id ?? null,
                },
              }
            : {
                buyer: {
                  budget: allocations.budget?.id ?? null,
                  storage: allocations.storage?.id ?? null,
                },
                seller: { budget: null, storage: null },
              },
      },
    }),
  ];
}

/**
 * Arrange a series of orders "buy here and sell there"
 * @param entity Ship that moves commodity
 */
export function resellCommodity(
  entity: RequireComponent<
    "storage" | "owner" | "orders" | "position" | "dockable"
  >,
  commodity: Commodity,
  buyer: WithTrade,
  seller: WithTrade
): boolean {
  const entityWithBudget = entity.sim
    .getOrThrow(
      entity.cp.commander ? entity.cp.commander.id : entity.cp.owner.id
    )
    .requireComponents(["budget"]);

  const availableSpace = getAvailableSpace(entity.cp.storage);
  const quantity = Math.floor(
    Math.min(
      buyer.cp.trade.offers[commodity].quantity,
      availableSpace,
      seller.cp.trade.offers[commodity].quantity,
      entityWithBudget.cp.budget.available /
        seller.cp.trade.offers[commodity].price
    )
  );

  if (quantity === 0) {
    return false;
  }

  const buyPrice =
    seller.id === entity.cp.commander?.id
      ? 0
      : seller.cp.trade.offers[commodity].price;
  const sellPrice =
    buyer.id === entity.cp.commander?.id
      ? 0
      : buyer.cp.trade.offers[commodity].price;

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
  ) {
    return false;
  }

  const sellActions = tradeCommodity(entity, offerForBuyer, buyer, seller);
  if (sellActions === null) {
    return false;
  }
  const buyActions = tradeCommodity(entity, offerForSeller, seller);
  if (buyActions === null) {
    const sellOrdersAllocations = (
      sellActions.find((o) => o.type === "trade") as TradeAction
    ).offer.allocations!;
    if (sellOrdersAllocations.buyer!.budget) {
      releaseBudgetAllocation(
        buyer.cp.budget,
        sellOrdersAllocations!.buyer!.budget!
      );
    }
    releaseStorageAllocation(
      buyer.cp.storage,
      sellOrdersAllocations.buyer!.storage!
    );
    return false;
  }

  const actions = [...buyActions, ...sellActions];

  entity.cp.orders.value.push({
    origin: "auto",
    type: "trade",
    actions,
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
  const minQuantity = entity.cp.storage.max / 10;
  const commander = entity.sim
    .getOrThrow(entity.cp.commander.id)
    .requireComponents(tradingCommanderComponents);
  if (commander.cp.trade.offers[commodity].quantity < minQuantity) return false;

  const target = getFacilityWithMostProfit(
    commander,
    commodity,
    minQuantity,
    jumps
  );

  if (!target) return false;

  return resellCommodity(entity, commodity, commander, target);
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
  const minQuantity = entity.cp.storage.max / 10;
  const commander = entity.sim
    .getOrThrow(entity.cp.commander.id)
    .requireComponents(tradingCommanderComponents);
  if (commander.cp.trade.offers[commodity].quantity < minQuantity) return false;

  const target = getFacilityWithMostProfit(
    commander,
    commodity,
    minQuantity,
    jumps
  );

  if (!target) return false;

  return resellCommodity(entity, commodity, target, commander);
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
  const commander = entity.sim
    .getOrThrow(entity.cp.commander.id)
    .requireComponents(tradingCommanderComponents);

  const deliveryOrders = pipe(
    commoditiesArray,
    filter(
      (commodity) =>
        entity.cp.storage.availableWares[commodity] > 0 &&
        commander.cp.trade.offers[commodity].quantity > 0 &&
        commander.cp.trade.offers[commodity].type === "buy"
    ),
    map((commodity) => {
      const offer: TransactionInput = {
        commodity,
        initiator: entity.id,
        quantity: limitMax(
          entity.cp.storage.availableWares[commodity],
          commander.cp.trade.offers[commodity].quantity
        ),
        price: 0,
        budget: null,
        allocations: null,
        type: "sell",
        factionId: entity.cp.owner.id,
      };

      const allocations = allocate(commander, offer);
      if (allocations) {
        return tradeAction(
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
        );
      }

      return undefined;
    }),
    filter(Boolean),
    toArray
  );

  if (deliveryOrders.length) {
    entity.cp.orders.value.push({
      origin: "auto",
      actions: [
        ...moveToActions(entity, commander),
        {
          type: "dock",
          targetId: commander.id,
        },
        ...deliveryOrders,
      ],
      type: "trade",
    });
  }
}

export function getSectorPrices(sector: Sector): SectorPriceStats {
  const facilities = sector.sim.queries.trading
    .get()
    .filter((facility) => facility.cp.position.sector === sector.id);

  return perCommodity((commodity) => {
    const buyOffers = facilities
      .filter(
        (facility) =>
          facility.cp.trade.offers[commodity].active &&
          facility.cp.trade.offers[commodity].type === "buy"
      )
      .map((facility) => facility.cp.trade.offers[commodity].price);

    const sellOffers = facilities
      .filter(
        (facility) =>
          facility.cp.trade.offers[commodity].active &&
          facility.cp.trade.offers[commodity].type === "sell"
      )
      .map((facility) => facility.cp.trade.offers[commodity].price);

    return {
      buy: buyOffers.length ? mean(buyOffers) : 0,
      sell: sellOffers.length ? mean(sellOffers) : 0,
    };
  });
}
