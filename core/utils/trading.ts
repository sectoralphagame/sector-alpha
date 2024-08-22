import { mean } from "mathjs";
import { filter, first, map, pipe, sortBy, toArray } from "@fxts/core";
import {
  changeRelations,
  relationThresholds,
} from "@core/components/relations";
import type { Faction } from "@core/archetypes/faction";
import { tradingSystem, updateOfferQuantity } from "@core/systems/trading";
import cloneDeep from "lodash/cloneDeep";
import type { Action, TradeAction } from "../components/orders";
import { tradeAction } from "../components/orders";
import type {
  TradeOfferType,
  TransactionAllocations,
  TransactionInput,
  TransactionItem,
} from "../components/trade";
import { createTransactionAllocations } from "../components/trade";
import type { Commodity } from "../economy/commodity";
import { commoditiesArray } from "../economy/commodity";
import type { WithTrade } from "../economy/utils";
import { getFacilityWithMostProfit } from "../economy/utils";
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
import type { Sector } from "../archetypes/sector";
import type { SectorPriceStats } from "../components/sectorStats";
import { limitMax } from "./limit";
import type { Waypoint } from "../archetypes/waypoint";

const tradingCommanderComponents = [
  "budget",
  "docks",
  "name",
  "position",
  "journal",
  "storage",
  "trade",
  "owner",
] as const;

export function isTradeAccepted(
  entity: WithTrade,
  input: Omit<TransactionInput, "allocations">
): boolean {
  const isTheSameFaction = input.factionId === entity.cp.owner.id;
  const isNotEnemy =
    isTheSameFaction ||
    entity.sim.getOrThrow<Faction>(entity.cp.owner.id).cp.relations.values[
      input.factionId
    ] > relationThresholds.trade;

  if (!isNotEnemy) return false;

  for (const transactionInput of input.items) {
    let isPriceValid = false;

    const offer = entity.cp.trade.offers[transactionInput.commodity];

    if (offer.price < 0) {
      throw new NonPositiveAmount(offer.price);
    }

    if (offer.type === transactionInput.type) {
      throw new InvalidOfferType(transactionInput.type);
    }

    if (offer.quantity < transactionInput.quantity) {
      throw new ExceededOfferQuantity(
        transactionInput.quantity,
        offer.quantity
      );
    }

    if (transactionInput.type === "buy") {
      if (isTheSameFaction) {
        isPriceValid = true;
      } else {
        isPriceValid = transactionInput.price >= offer.price;
      }

      return (
        isPriceValid &&
        hasSufficientStorage(
          entity.cp.storage,
          transactionInput.commodity,
          transactionInput.quantity
        )
      );
    }

    if (isTheSameFaction) {
      isPriceValid = true;
    } else {
      isPriceValid = transactionInput.price <= offer.price;
    }

    const canAfford =
      entity.cp.budget.available >=
      transactionInput.price * transactionInput.quantity;
    const hasSpace = hasSufficientStorageSpace(
      entity.cp.storage,
      transactionInput.quantity
    );

    if (!(isPriceValid && canAfford && hasSpace)) return false;
  }

  return true;
}

export function acceptTrade(
  entityWithOffer: WithTrade,
  input: TransactionInput
) {
  const sim = entityWithOffer.sim;
  const customerBudget = sim
    .getOrThrow(input.budgets.customer)
    .requireComponents(["budget"]).cp.budget;
  const traderBudget = sim
    .getOrThrow(input.budgets.trader)
    .requireComponents(["budget"]).cp.budget;

  if (input.allocations.customer.budget) {
    const allocation = releaseBudgetAllocation(
      customerBudget,
      input.allocations.customer.budget,
      "accepted"
    );
    transferMoney(customerBudget, allocation.amount, traderBudget);
  } else if (input.allocations.trader.budget) {
    const allocation = releaseBudgetAllocation(
      traderBudget,
      input.allocations.trader.budget,
      "accepted"
    );
    transferMoney(traderBudget, allocation.amount, customerBudget);
  }

  for (const inputItem of input.items) {
    if (entityWithOffer.cp.owner.id !== input.factionId) {
      const initiator = entityWithOffer.sim
        .getOrThrow(input.initiator)
        .requireComponents(["name", "journal"]);

      entityWithOffer.cp.journal.entries.push({
        type: "trade",
        action: inputItem.type === "buy" ? "sell" : "buy",
        commodity: inputItem.commodity,
        quantity: inputItem.quantity,
        price: inputItem.price,
        target: initiator.cp.name.value,
        targetId: initiator.id,
        time: entityWithOffer.sim.getTime(),
      });
      initiator.cp.journal.entries.push({
        type: "trade",
        action: inputItem.type,
        commodity: inputItem.commodity,
        quantity: inputItem.quantity,
        price: inputItem.price,
        target: entityWithOffer.requireComponents(["name"]).cp.name.value,
        targetId: entityWithOffer.id,
        time: entityWithOffer.sim.getTime(),
      });

      const player = first(entityWithOffer.sim.queries.player.getIt())!;
      if ([input.factionId, entityWithOffer.cp.owner.id].includes(player.id)) {
        changeRelations(
          player,
          entityWithOffer.sim.getOrThrow<Faction>(entityWithOffer.cp.owner.id),
          inputItem.price / 1e6
        );
      }
    }
  }
}

/**
 * Allocates resources necessary to finish trade before it is actually done
 *
 * @param trader Entity with offers, like facility
 * @param offer Transaction input
 */
export function allocate(
  trader: WithTrade,
  offer: Omit<TransactionInput, "allocations">
): TransactionAllocations {
  // FIXME: Trader and customer values are literally the same but mirrored
  const allocationsToMake: Record<
    "trader" | "customer",
    { budget: number; storage: Partial<Record<Commodity, number>> }
  > = {
    trader: {
      budget: 0,
      storage: {},
    },
    customer: {
      budget: 0,
      storage: {},
    },
  };

  for (const item of offer.items) {
    if (item.type === "buy") {
      if (item.price) {
        allocationsToMake.customer.budget -= item.price * item.quantity;
        allocationsToMake.trader.budget += item.price * item.quantity;
      }

      allocationsToMake.customer.storage[item.commodity]! ??= 0;
      allocationsToMake.customer.storage[item.commodity]! += item.quantity;
      allocationsToMake.trader.storage[item.commodity]! ??= 0;
      allocationsToMake.trader.storage[item.commodity]! -= item.quantity;
    } else {
      if (item.price) {
        allocationsToMake.customer.budget += item.price * item.quantity;
        allocationsToMake.trader.budget -= item.price * item.quantity;
      }
      allocationsToMake.customer.storage[item.commodity]! ??= 0;
      allocationsToMake.customer.storage[item.commodity]! -= item.quantity;
      allocationsToMake.trader.storage[item.commodity]! ??= 0;
      allocationsToMake.trader.storage[item.commodity]! += item.quantity;
    }
  }

  const allocations = createTransactionAllocations();
  const issued = trader.sim.getTime();

  if (allocationsToMake.customer.budget < 0) {
    allocations.customer.budget = newBudgetAllocation(
      trader.sim
        .getOrThrow(offer.budgets.customer)
        .requireComponents(["budget"]).cp.budget,
      {
        amount: Math.abs(allocationsToMake.customer.budget),
        issued,
      },
      { tradeId: offer.tradeId }
    )?.id;
  }

  if (allocationsToMake.trader.budget < 0) {
    allocations.trader.budget = newBudgetAllocation(
      trader.cp.budget,
      {
        amount: Math.abs(allocationsToMake.trader.budget),
        issued,
      },
      { tradeId: offer.tradeId }
    )?.id;
  }

  if (Object.keys(allocationsToMake.customer.storage).length) {
    allocations.customer.storage = newStorageAllocation(
      trader.sim.getOrThrow(offer.initiator).requireComponents(["storage"]).cp
        .storage,
      {
        amount: perCommodity(
          (commodity) => allocationsToMake.customer.storage[commodity] || 0
        ),
        issued,
      },
      { tradeId: offer.tradeId }
    )?.id;
  }

  if (Object.keys(allocationsToMake.trader.storage).length) {
    allocations.trader.storage = newStorageAllocation(
      trader.cp.storage,
      {
        amount: perCommodity(
          (commodity) => allocationsToMake.trader.storage[commodity] || 0
        ),
        issued,
      },
      { tradeId: offer.tradeId }
    )?.id;
  }

  return allocations;
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
export function arrangeTrade(
  entity: RequireComponent<
    "storage" | "owner" | "orders" | "position" | "dockable"
  >,
  offer: Omit<TransactionInput, "allocations">,
  target: WithTrade,
  position?: Waypoint
): Action[] | null {
  if (!isTradeAccepted(target, offer)) {
    return null;
  }

  const allocations = allocate(target, offer);
  updateOfferQuantity(target);

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
        allocations,
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
  const availableMoney =
    seller.cp.owner.id === entity.cp.owner.id
      ? Infinity
      : entityWithBudget.cp.budget.available;

  const availableSpace = getAvailableSpace(entity.cp.storage);
  const quantity = Math.floor(
    Math.min(
      buyer.cp.trade.offers[commodity].quantity,
      availableSpace,
      seller.cp.trade.offers[commodity].quantity,
      availableMoney / seller.cp.trade.offers[commodity].price
    )
  );

  if (quantity <= 0) {
    return false;
  }

  const buyPrice =
    seller.cp.owner.id === entity.cp.owner.id
      ? 0
      : seller.cp.trade.offers[commodity].price;
  const sellPrice =
    seller.cp.owner.id === entity.cp.owner.id
      ? 0
      : buyer.cp.trade.offers[commodity].price;

  const offer = {
    initiator: entity.id,
    factionId: entity.cp.owner.id,
    budgets: {
      trader: 0,
      customer: entity.cp.commander?.id ?? entity.cp.owner.id,
    },
  };

  // Entity buys from facility, facility sells
  const offerForBuyer = {
    ...cloneDeep(offer),
    tradeId: tradingSystem.createId(entity.id, buyer.id),
    items: [
      {
        commodity,
        quantity,
        price: sellPrice,
        type: "sell" as TradeOfferType,
      },
    ],
  };
  offerForBuyer.budgets.trader = buyer.id;
  // Entity sells to facility, facility buys
  const offerForSeller = {
    ...cloneDeep(offer),
    tradeId: tradingSystem.createId(entity.id, seller.id),
    items: [
      {
        commodity,
        quantity,
        price: buyPrice,
        type: "buy" as TradeOfferType,
      },
    ],
  };
  offerForSeller.budgets.trader = seller.id;

  if (buyPrice * quantity > availableMoney) {
    return false;
  }

  const buyActions = arrangeTrade(entity, offerForSeller, seller);
  if (buyActions === null) {
    return false;
  }
  const sellActions = arrangeTrade(entity, offerForBuyer, buyer, seller);
  if (sellActions === null) {
    const sellOrdersAllocations = (
      buyActions.find((o) => o.type === "trade") as TradeAction
    ).offer.allocations!;
    if (sellOrdersAllocations.customer!.budget) {
      releaseBudgetAllocation(
        entityWithBudget.cp.budget,
        sellOrdersAllocations!.customer!.budget!,
        "accepted"
      );
    }
    if (sellOrdersAllocations.trader!.budget) {
      releaseBudgetAllocation(
        entityWithBudget.cp.budget,
        sellOrdersAllocations!.trader!.budget!,
        "accepted"
      );
    }
    releaseStorageAllocation(
      seller.cp.storage,
      sellOrdersAllocations.trader!.storage!,
      "accepted"
    );
    releaseStorageAllocation(
      entity.cp.storage,
      sellOrdersAllocations.customer!.storage!,
      "accepted"
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

  const itemsToDeliver = pipe(
    commoditiesArray,
    filter(
      (commodity) =>
        entity.cp.storage.availableWares[commodity] > 0 &&
        commander.cp.trade.offers[commodity].quantity > 0 &&
        commander.cp.trade.offers[commodity].type === "buy"
    ),
    map((commodity) => {
      const offer: TransactionItem = {
        commodity,
        quantity: limitMax(
          entity.cp.storage.availableWares[commodity],
          commander.cp.trade.offers[commodity].quantity
        ),
        price: 0,
        type: "sell",
      };

      return offer;
    }),
    filter(Boolean),
    toArray
  );

  const offer = {
    items: itemsToDeliver,
    budgets: {
      customer: entity.cp.owner.id,
      trader: commander.id,
    },
    factionId: entity.cp.owner.id,
    initiator: entity.id,
    tradeId: tradingSystem.createId(entity.id, commander.id),
  };

  arrangeTrade(entity, offer, commander);
}

export function getSectorPrices(sector: Sector): SectorPriceStats {
  const facilities = sector.sim.queries.bySectors.trading.get(sector.id);

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
