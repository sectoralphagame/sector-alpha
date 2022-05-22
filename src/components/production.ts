import { cloneDeep, merge } from "lodash";
import { sum } from "mathjs";
import { commodities, Commodity } from "../economy/commodity";
import { Cooldowns } from "../utils/cooldowns";
import { perCommodity } from "../utils/perCommodity";
import { BaseComponent } from "./component";

export interface CommodityPAC {
  produces: number;
  consumes: number;
}

/**
 * Production and consumption of commodities
 */
export type PAC = Record<Commodity, CommodityPAC>;

export const baseProductionAndConsumption = perCommodity(
  (): CommodityPAC => ({
    consumes: 0,
    produces: 0,
  })
);

export interface BaseProduction {
  pac: PAC;
}

export function getSummedConsumption(production: BaseProduction): number {
  return sum(
    Object.values(commodities).map(
      (commodity) => production.pac[commodity].consumes
    )
  );
}

export function getSummedProduction(production: BaseProduction): number {
  return sum(
    Object.values(commodities).map(
      (commodity) => production.pac[commodity].produces
    )
  );
}

export function getRequiredStorage(production: BaseProduction): number {
  return getSummedConsumption(production) + getSummedProduction(production);
}

export interface Production
  extends BaseComponent<"production">,
    BaseProduction {
  pac: PAC;

  /**
   * Duration of production cycle in seconds
   */
  time: number;
}

export function createProduction(
  time: number,
  pac: Partial<PAC> = {}
): Production {
  return {
    name: "production",
    pac: merge(cloneDeep(baseProductionAndConsumption), pac),
    time,
  };
}

/**
 * Mark entity as able to produce, but delegate it to entity's modules having
 * `Production` component
 */
export interface CompoundProduction
  extends BaseComponent<"compoundProduction">,
    BaseProduction {}

export function createCompoundProduction(
  pac: Partial<PAC> = {}
): CompoundProduction {
  return {
    name: "compoundProduction",
    pac: merge(cloneDeep(baseProductionAndConsumption), pac),
  };
}
