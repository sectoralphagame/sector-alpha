import cloneDeep from "lodash/cloneDeep";
import { perCommodity } from "../utils/perCommodity";
import { Commodity } from "./commodity";

export interface CommodityProductionAndConsumption {
  produces: number;
  consumes: number;
}
export type ProductionAndConsumption = Record<
  Commodity,
  CommodityProductionAndConsumption
>;

export const baseProductionAndConsumption = perCommodity(
  (): CommodityProductionAndConsumption => ({
    consumes: 0,
    produces: 0,
  })
);

export interface FacilityModule {
  name: string;
  productionAndConsumption: ProductionAndConsumption;
  storage: number;
}

export function createFacilityModule(
  name: string,
  storage: number,
  pac: Partial<ProductionAndConsumption>
): FacilityModule {
  return {
    name,
    productionAndConsumption: {
      ...cloneDeep(baseProductionAndConsumption),
      ...pac,
    },
    storage,
  };
}

export const facilityModules = {
  dummy_iceProduction: createFacilityModule("Ice Production (dev)", 0, {
    ice: { consumes: 0, produces: 10 },
  }),
  dummy_fueliumProduction: createFacilityModule("Fuelium Production (dev)", 0, {
    fuelium: { consumes: 0, produces: 10 },
  }),
  dummy_oreProduction: createFacilityModule("Ore Production (dev)", 0, {
    ore: { consumes: 0, produces: 15 },
  }),
  water: createFacilityModule("Water Production", 0, {
    food: { consumes: 1, produces: 0 },
    ice: { consumes: 20, produces: 0 },
    water: { consumes: 0, produces: 10 },
  }),
  farm: createFacilityModule("Farm", 0, {
    food: { consumes: 0, produces: 15 },
    fuel: { consumes: 1, produces: 0 },
    water: { consumes: 3, produces: 0 },
  }),
  refinery: createFacilityModule("Refinery", 0, {
    food: { consumes: 2, produces: 0 },
    ore: { consumes: 20, produces: 0 },
    metals: { consumes: 0, produces: 15 },
    fuel: { consumes: 2, produces: 0 },
  }),
  fuelFabrication: createFacilityModule("Fuel Fabrication", 0, {
    fuelium: { consumes: 20, produces: 0 },
    fuel: { consumes: 0, produces: 10 },
  }),
  habitat: createFacilityModule("Habitation Zone", 0, {
    food: { consumes: 5, produces: 0 },
  }),
  hullPlates: createFacilityModule("Hull Plates Production ", 0, {
    food: { consumes: 2, produces: 0 },
    fuel: { consumes: 7, produces: 0 },
    metals: { consumes: 25, produces: 0 },
    hullPlates: { consumes: 0, produces: 70 },
  }),
  shipyard: createFacilityModule("Shipyard", 0, {
    food: { consumes: 2, produces: 0 },
    fuel: { consumes: 3, produces: 0 },
    hullPlates: { consumes: 10, produces: 0 },
  }),
  containerSmall: createFacilityModule("Small Container", 1000, {}),
} as const;
