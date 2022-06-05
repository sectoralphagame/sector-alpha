import { sum } from "mathjs";
import { startingPrice, TradeOffer } from "../components/trade";
import { Commodity } from "../economy/commodity";
import { getPlannedBudget, WithTrade } from "../economy/utils";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import { Cooldowns } from "../utils/cooldowns";
import { limitMin } from "../utils/limit";
import { perCommodity } from "../utils/perCommodity";
import { System } from "./system";

type WithTradeAndProduction = WithTrade &
  RequireComponent<"compoundProduction">;

/**
 *
 * Commodity cost of production
 */
function getProductionCost(
  entity: RequireComponent<"modules" | "trade">,
  commodity: Commodity
): number {
  const productionModule = entity.cp.modules.modules
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
    const notOffered = entity.cp.trade.offers[commodity].quantity <= 0;
    const stockpiled =
      entity.cp.trade.offers[commodity].type === "buy" &&
      entity.cp.storage.getAvailableWares()[commodity] /
        entity.cp.storage.quota[commodity] >
        0.8;

    if (stockpiled || notOffered) {
      return;
    }

    const minPrice =
      entity.cp.trade.offers[commodity].type === "buy"
        ? 1
        : entity.hasComponents(["compoundProduction"])
        ? getProductionCost(
            entity.requireComponents([
              "compoundProduction",
              "trade",
              "modules",
            ]),
            commodity
          )
        : 1;
    let delta = limitMin(
      Math.floor(entity.cp.trade.offers[commodity].price * 0.01),
      1
    );
    if (
      (entity.cp.trade.offers[commodity].type === "sell") ===
      change[commodity] <= 0
    ) {
      delta *= -1;
    }

    entity.cp.trade.offers[commodity].price = limitMin(
      entity.cp.trade.offers[commodity].price + delta,
      minPrice
    );
  });

  entity.cp.trade.lastPriceAdjust = {
    commodities: quantities,
    time: entity.sim.getTime(),
  };
}

function getProductionSurplus(
  entity: WithTradeAndProduction,
  commodity: Commodity
) {
  return (
    entity.cp.compoundProduction.pac[commodity].produces -
    entity.cp.compoundProduction.pac[commodity].consumes
  );
}

function getSurplus(entity: WithTradeAndProduction, commodity: Commodity) {
  return (
    entity.cp.storage.getAvailableWares()[commodity] +
    getProductionSurplus(entity, commodity)
  );
}

export function getOfferedQuantity(entity: WithTrade, commodity: Commodity) {
  if (!entity.hasComponents(["compoundProduction"])) {
    return entity.cp.storage.getAvailableWares()[commodity];
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
    return getSurplus(entityWithProduction, commodity);
  }

  const stored = entityWithProduction.cp.storage.getAvailableWares();

  if (getProductionSurplus(entityWithProduction, commodity) > 0) {
    return stored[commodity] - production.pac[commodity].consumes * 2;
  }

  const requiredBudget = getPlannedBudget(entityWithProduction);
  const availableBudget = entityWithProduction.cp.budget.getAvailableMoney();
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
    const quantity = getOfferedQuantity(entity, commodity);

    return {
      price:
        (entity.cp.trade.offers && entity.cp.trade.offers[commodity].price) ??
        startingPrice,
      quantity: quantity > 0 ? quantity : -quantity,
      type: quantity > 0 ? "sell" : "buy",
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
      this.cooldowns.use("adjustPrices", 150);
      this.sim.queries.trading.get().forEach(adjustPrices);
    }

    if (this.cooldowns.canUse("createOffers")) {
      this.cooldowns.use("createOffers", 2);
      this.sim.queries.trading.get().forEach(createOffers);
    }
  };
}
