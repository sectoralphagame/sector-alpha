import { sum } from "mathjs";
import { commodities } from "../economy/commodity";
import { System } from "./system";

const basketCommodities = [
  commodities.food,
  commodities.water,
  commodities.fuel,
  commodities.ore,
  commodities.silicon,
  commodities.hullPlates,
  commodities.electronics,
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
        this.sim.queries.settings.get()[0].cp.systemManager
          .lastInflationStatUpdate >
      10 * 60
    ) {
      this.sim.queries.settings.get()[0].cp.systemManager.lastInflationStatUpdate =
        this.sim.getTime();

      const basket = basketCommodities.reduce(
        (acc, commodity) => ({ ...acc, [commodity]: [] }),
        {} as Record<BasketCommodities, number[]>
      );

      this.sim.queries.trading.get().forEach((trader) => {
        basketCommodities.forEach((commodity) => {
          if (
            trader.cp.trade.offers[commodity].active &&
            trader.cp.trade.offers[commodity].type === "sell"
          ) {
            basket[commodity].push(trader.cp.trade.offers[commodity].price);
          }
        });
      });

      const basketPrice = basketCommodities.reduce(
        (acc, commodity) =>
          acc + sum(basket[commodity]) * basketWeights[commodity],
        0
      );
      if (basketPrice > 0) {
        this.sim.queries.settings
          .get()[0]
          .cp.inflationStats.basketPrices.push(basketPrice);
      }
    }
  };
}
