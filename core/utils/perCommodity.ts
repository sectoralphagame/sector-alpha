import { getCommodityCost } from "@core/economy/utils";
import { max, min } from "@fxts/core";
import type { Commodity } from "../economy/commodity";
import { commoditiesArray } from "../economy/commodity";
import modules from "../world/data/facilityModules.json";

export function perCommodity<T>(
  // eslint-disable-next-line no-unused-vars
  cb: (commodity: Commodity) => T
): Record<Commodity, T> {
  const ret = {} as Record<Commodity, T>;

  for (const commodity of commoditiesArray) {
    ret[commodity] = cb(commodity);
  }

  return ret;
}

export const commodityPrices = perCommodity((commodity) => ({
  min: getCommodityCost(commodity, modules as any, min),
  avg: getCommodityCost(commodity, modules as any),
  max: getCommodityCost(commodity, modules as any, max),
}));
