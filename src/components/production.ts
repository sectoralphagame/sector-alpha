import { cloneDeep, merge } from "lodash";
import { sum } from "mathjs";
import { commodities, Commodity } from "../economy/commodity";
import { Cooldowns } from "../utils/cooldowns";
import { perCommodity } from "../utils/perCommodity";

export interface CommodityProductionAndConsumption {
  produces: number;
  consumes: number;
}

/**
 * Production and consumption of commodities
 */
export type PAC = Record<Commodity, CommodityProductionAndConsumption>;

export const baseProductionAndConsumption = perCommodity(
  (): CommodityProductionAndConsumption => ({
    consumes: 0,
    produces: 0,
  })
);

export class BaseProduction {
  pac: PAC;

  constructor() {
    this.pac = cloneDeep(baseProductionAndConsumption);
  }

  getSummedConsumption = () =>
    sum(
      Object.values(commodities).map(
        (commodity) => this.pac[commodity].consumes
      )
    );

  getSummedProduction = () =>
    sum(
      Object.values(commodities).map(
        (commodity) => this.pac[commodity].produces
      )
    );

  getRequiredStorage = () =>
    this.getSummedConsumption() + this.getSummedProduction();
}

export class Production extends BaseProduction {
  cooldowns: Cooldowns<"production">;
  pac: PAC;

  /**
   * Duration of production cycle in seconds
   */
  time: number;

  constructor(time: number, pac: Partial<PAC> = {}) {
    super();
    this.cooldowns = new Cooldowns("production");
    this.pac = merge(cloneDeep(baseProductionAndConsumption), pac);
    this.time = time;
  }
}

/**
 * Mark entity as able to produce, but delegate it to entity's modules having
 * `Production` component
 */
export class CompoundProduction extends BaseProduction {}
