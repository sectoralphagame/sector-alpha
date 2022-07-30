import { sum } from "mathjs";
import { faction } from "../archetypes/faction";
import { startingPrice, TradeOffer } from "../components/trade";
import { Commodity } from "../economy/commodity";
import { getPlannedBudget, WithTrade } from "../economy/utils";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import { Cooldowns } from "../utils/cooldowns";
import { limitMin } from "../utils/limit";
import { perCommodity } from "../utils/perCommodity";
import { System } from "./system";

/**
 *
 * Commodity cost of production
 */
function getProductionCost(
  entity: RequireComponent<"modules" | "trade">,
  commodity: Commodity
): number {
  const productionModule = entity.cp.modules.ids
    .map(entity.sim.getOrThrow)
    .find((m) => m.cp.production?.pac[commodity].produces)
    ?.requireComponents(["production"]);

  if (!productionModule) {
    return entity.cp.trade.offers[commodity].price;
  }

  return Math.ceil(
    sum(
      Object.values(
        perCommodity((c) =>
          productionModule.cp.production.pac[c].consumes
            ? (getProductionCost(entity, c) *
                productionModule.cp.production.pac[c].consumes) /
              productionModule.cp.production.pac[commodity].produces
            : 0
        )
      )
    )
  );
}

function adjustSellPrice(
  entity: WithTrade,
  commodity: Commodity,
  change: number
): number {
  const notOffered = entity.cp.trade.offers[commodity].quantity <= 0;
  const stockpiled =
    entity.cp.storage.availableWares[commodity] /
      entity.cp.storage.quota[commodity] >
    0.75;
  const changedWithinAcceptableMargin =
    entity.cp.trade.lastPriceAdjust.commodities[commodity] > 0 &&
    Math.abs(change / entity.cp.trade.lastPriceAdjust.commodities[commodity]) <
      0.2;

  if (notOffered || (changedWithinAcceptableMargin && !stockpiled)) {
    return entity.cp.trade.offers[commodity].price;
  }

  const minPrice = entity.hasComponents(["compoundProduction"])
    ? getProductionCost(
        entity.requireComponents(["compoundProduction", "trade", "modules"]),
        commodity
      )
    : 1;
  let delta = limitMin(
    Math.floor(
      entity.cp.trade.offers[commodity].price *
        faction(entity.sim.getOrThrow(entity.cp.owner.id)).cp.ai!.priceModifier
    ),
    1
  );
  if ((stockpiled && delta > 0) || change <= 0) {
    delta *= -1;
  }

  return limitMin(entity.cp.trade.offers[commodity].price + delta, minPrice);
}

function adjustBuyPrice(
  entity: WithTrade,
  commodity: Commodity,
  change: number
): number {
  const notOffered = entity.cp.trade.offers[commodity].quantity <= 0;
  const urgentNeed =
    entity.cp.storage.availableWares[commodity] /
      entity.cp.storage.quota[commodity] <
    0.35;

  if (notOffered && !urgentNeed) {
    return entity.cp.trade.offers[commodity].price;
  }

  let delta = limitMin(
    Math.floor(
      entity.cp.trade.offers[commodity].price *
        faction(entity.sim.getOrThrow(entity.cp.owner.id)).cp.ai!.priceModifier
    ),
    1
  );

  if (change > 0 || !urgentNeed) {
    delta *= -1;
  }

  return limitMin(entity.cp.trade.offers[commodity].price + delta, 1);
}

export function adjustPrices(entity: WithTrade) {
  const quantities = perCommodity(
    (commodity) =>
      sum(
        entity.cp.trade.transactions
          .filter(
            (transaction) =>
              transaction.commodity === commodity &&
              transaction.time > entity.cp.trade.lastPriceAdjust.time &&
              transaction.type !== entity.cp.trade.offers[commodity].type
          )
          .map((h) => h.quantity)
      ) as number
  );
  const change = perCommodity(
    (commodity) =>
      quantities[commodity] -
      entity.cp.trade.lastPriceAdjust.commodities[commodity]
  );

  perCommodity((commodity) => {
    entity.cp.trade.offers[commodity].price =
      entity.cp.trade.offers[commodity].type === "sell"
        ? adjustSellPrice(entity, commodity, change[commodity])
        : adjustBuyPrice(entity, commodity, change[commodity]);
  });

  entity.cp.trade.lastPriceAdjust = {
    commodities: quantities,
    time: entity.sim.getTime(),
  };
}

export function getProductionSurplus(
  entity: RequireComponent<"compoundProduction">,
  commodity: Commodity
) {
  return (
    entity.cp.compoundProduction.pac[commodity].produces -
    entity.cp.compoundProduction.pac[commodity].consumes
  );
}

export function getOfferedQuantity(entity: WithTrade, commodity: Commodity) {
  if (!entity.hasComponents(["compoundProduction"])) {
    return entity.cp.storage.availableWares[commodity];
  }

  const entityWithProduction = entity.requireComponents([
    "compoundProduction",
    "budget",
    "docks",
    "position",
    "storage",
    "owner",
    "trade",
  ]);
  const production = entityWithProduction.cp.compoundProduction;

  if (
    production.pac[commodity].consumes === production.pac[commodity].produces &&
    production.pac[commodity].consumes === 0
  ) {
    return entity.cp.storage.availableWares[commodity];
  }

  const stored = entityWithProduction.cp.storage.availableWares;

  if (getProductionSurplus(entityWithProduction, commodity) > 0) {
    return stored[commodity] - production.pac[commodity].consumes * 2;
  }

  const requiredBudget = getPlannedBudget(entityWithProduction);
  const availableBudget = entityWithProduction.cp.budget.available;
  const quota = entityWithProduction.cp.storage.quota[commodity];

  if (stored[commodity] > quota) {
    return stored[commodity] - quota;
  }

  const multiplier =
    requiredBudget > availableBudget ? availableBudget / requiredBudget : 1;

  return Math.floor(multiplier * (stored[commodity] - quota));
}

export function createOffers(entity: WithTrade) {
  entity.cp.trade.offers = perCommodity((commodity): TradeOffer => {
    const offeredQuantity = getOfferedQuantity(entity, commodity);
    const producedNet = entity.hasComponents(["compoundProduction"])
      ? getProductionSurplus(
          entity.requireComponents(["compoundProduction"]),
          commodity
        )
      : 0;

    return {
      price:
        (entity.cp.trade.offers && entity.cp.trade.offers[commodity].price) ??
        startingPrice,
      quantity: offeredQuantity > 0 ? offeredQuantity : -offeredQuantity,
      type:
        offeredQuantity > 0
          ? "sell"
          : offeredQuantity === 0 && producedNet > 0
          ? "sell"
          : "buy",
    };
  });
}

export class TradingSystem extends System {
  cooldowns: Cooldowns<"adjustPrices" | "createOffers">;

  constructor(sim: Sim) {
    super(sim);
    this.cooldowns = new Cooldowns("adjustPrices", "createOffers");
  }

  exec = (delta: number): void => {
    this.cooldowns.update(delta);

    if (this.cooldowns.canUse("adjustPrices")) {
      this.cooldowns.use("adjustPrices", 300);
      this.sim.queries.trading.get().forEach(adjustPrices);
    }

    if (this.cooldowns.canUse("createOffers")) {
      this.cooldowns.use("createOffers", 1);
      this.sim.queries.trading.get().forEach(createOffers);
    }
  };
}
