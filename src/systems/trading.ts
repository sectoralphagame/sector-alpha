import { sum } from "mathjs";
import { Entity } from "../components/entity";
import { startingPrice, TradeOffer } from "../components/trade";
import { Commodity } from "../economy/commodity";
import { getPlannedBudget } from "../economy/utils";
import { Sim } from "../sim";
import { Cooldowns } from "../utils/cooldowns";
import { limitMin } from "../utils/limit";
import { perCommodity } from "../utils/perCommodity";
import { System } from "./system";

/**
 *
 * Commodity cost of production
 */
function getProductionCost(entity: Entity, commodity: Commodity): number {
  const productionModule = entity.cp.modules.modules.find(
    (m) => m.cp.production?.pac[commodity].produces > 0
  );

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

export function adjustPrices(entity: Entity) {
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
        ? getProductionCost(entity, commodity)
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

function getProductionSurplus(entity: Entity, commodity: Commodity) {
  return (
    entity.cp.compoundProduction.pac[commodity].produces -
    entity.cp.compoundProduction.pac[commodity].consumes
  );
}

function getSurplus(entity: Entity, commodity: Commodity) {
  return (
    entity.cp.storage.getAvailableWares()[commodity] +
    getProductionSurplus(entity, commodity)
  );
}

export function getOfferedQuantity(entity: Entity, commodity: Commodity) {
  if (!entity.hasComponents(["compoundProduction"])) {
    return entity.cp.storage.getAvailableWares()[commodity];
  }

  if (
    entity.cp.compoundProduction.pac[commodity].consumes ===
      entity.cp.compoundProduction.pac[commodity].produces &&
    entity.cp.compoundProduction.pac[commodity].consumes === 0
  ) {
    return getSurplus(entity, commodity);
  }

  const stored = entity.cp.storage.getAvailableWares();

  if (getProductionSurplus(entity, commodity) > 0) {
    return (
      stored[commodity] -
      entity.cp.compoundProduction.pac[commodity].consumes * 2
    );
  }

  const requiredBudget = getPlannedBudget(entity);
  const availableBudget = entity.cp.budget.getAvailableMoney();
  const quota = entity.cp.storage.quota[commodity];

  if (stored[commodity] > quota) {
    return stored[commodity] - quota;
  }

  const multiplier =
    requiredBudget > availableBudget ? availableBudget / requiredBudget : 1;

  return Math.floor(multiplier * (stored[commodity] - quota));
}

export function createOffers(entity: Entity) {
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
      this.cooldowns.use("adjustPrices", 300);
      this.sim.queries.trading.get().forEach(adjustPrices);
    }

    if (this.cooldowns.canUse("createOffers")) {
      this.cooldowns.use("createOffers", 2);
      this.sim.queries.trading.get().forEach(createOffers);
    }
  };
}
