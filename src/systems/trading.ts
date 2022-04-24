import { sum } from "mathjs";
import { Entity } from "../components/entity";
import { Commodity } from "../economy/commodity";
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

function adjustPrices(entity: Entity) {
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
        : getProductionCost(entity, commodity);
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

export class BudgetPlanningSystem extends System {
  cooldowns: Cooldowns<"adjustPrices">;

  constructor(sim: Sim) {
    super(sim);
    this.cooldowns = new Cooldowns("adjustPrices");
  }

  query = () => this.sim.entities.filter((e) => e.hasComponents(["trade"]));

  exec = (delta: number): void => {
    this.cooldowns.update(delta);

    if (this.cooldowns.canUse("adjustPrices")) {
      this.cooldowns.use("adjustPrices", 300);
      this.query().forEach(adjustPrices);
    }
  };
}
