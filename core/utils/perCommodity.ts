import { getCommodityCost } from "@core/economy/utils";
import { max, min } from "@fxts/core";
import type { Commodity } from "../economy/commodity";
import { commoditiesArray } from "../economy/commodity";
import modules from "../world/data/facilityModules.json";

export function perCommodity<T>(
  // eslint-disable-next-line no-unused-vars
  cb: (commodity: Commodity) => T
): Record<Commodity, T> {
  return commoditiesArray
    .map((commodity) => ({
      commodity,
      data: cb(commodity),
    }))
    .reduce(
      (acc, v) => ({ ...acc, [v.commodity]: v.data }),
      {} as Record<Commodity, T>
    );
}

export const commodityPrices = perCommodity((commodity) => ({
  min: getCommodityCost(commodity, modules as any, min),
  avg: getCommodityCost(commodity, modules as any),
  max: getCommodityCost(commodity, modules as any, max),
}));
