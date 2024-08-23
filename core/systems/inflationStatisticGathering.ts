import { first } from "@fxts/core";
import { sum } from "mathjs";
import { System } from "./system";

const basketCommodities = [
  "food",
  "water",
  "fuel",
  "ore",
  "silicon",
  "hullPlates",
  "electronics",
] as const;
type BasketCommodities = (typeof basketCommodities)[number];
const basketWeights: Record<BasketCommodities, number> = {
  food: 30,
  water: 30,
  fuel: 30,
  ore: 20,
  silicon: 20,
  hullPlates: 5,
  electronics: 5,
};

export class InflationStatisticGatheringSystem extends System {
  exec = (): void => {
    if (
      this.sim.getTime() -
        first(this.sim.index.settings.getIt())!.cp.systemManager
          .lastInflationStatUpdate >
      10 * 60
    ) {
      first(
        this.sim.index.settings.getIt()
      )!.cp.systemManager.lastInflationStatUpdate = this.sim.getTime();

      const basket = basketCommodities.reduce(
        (acc, commodity) => ({ ...acc, [commodity]: [] }),
        {} as Record<BasketCommodities, number[]>
      );

      for (const trader of this.sim.index.trading.getIt()) {
        basketCommodities.forEach((commodity) => {
          if (
            trader.cp.trade.offers[commodity].active &&
            trader.cp.trade.offers[commodity].type === "sell"
          ) {
            basket[commodity].push(trader.cp.trade.offers[commodity].price);
          }
        });
      }

      const basketPrice = basketCommodities.reduce(
        (acc, commodity) =>
          acc + sum(basket[commodity]) * basketWeights[commodity],
        0
      );
      if (basketPrice > 0) {
        this.sim.index.settings
          .get()[0]
          .cp.inflationStats.basketPrices.push(basketPrice);
      }
    }
  };
}

export const inflationStatisticGatheringSystem =
  new InflationStatisticGatheringSystem();
