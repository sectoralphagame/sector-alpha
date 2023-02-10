import { Commodity } from "@core/economy/commodity";
import { fromEntries, pipe, map } from "@fxts/core";
import { Entity } from "../components/entity";
import { createProduction, PAC } from "../components/production";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import modules from "../world/data/facilityModules.json";

export interface FacilityModuleCommonInput {
  name: string;
  slug: string;
  build: {
    cost: Partial<Record<Commodity, number>>;
    time: number;
  };
}
export interface ProductionFacilityModuleInput
  extends FacilityModuleCommonInput {
  pac: Partial<PAC>;
  time: number;
  type: "production";
}
export interface StorageFacilityModuleInput extends FacilityModuleCommonInput {
  storage: number;
  type: "storage";
}
export interface ShipyardFacilityModuleInput extends FacilityModuleCommonInput {
  type: "shipyard";
}
export interface TeleportFacilityModuleInput extends FacilityModuleCommonInput {
  type: "teleport";
}
export interface HabitatFacilityModuleInput extends FacilityModuleCommonInput {
  pac: Partial<PAC>;
  time: number;
  crew: number;
  type: "habitat";
}
export type FacilityModuleInput =
  | ProductionFacilityModuleInput
  | StorageFacilityModuleInput
  | ShipyardFacilityModuleInput
  | TeleportFacilityModuleInput
  | HabitatFacilityModuleInput;

export type FacilityModule = RequireComponent<"parent" | "name">;

export function createFacilityModule(
  sim: Sim,
  input: FacilityModuleInput & {
    parent: Entity;
  }
) {
  const entity = new Entity(sim);
  entity
    .addComponent({
      name: "parent",
      id: input.parent.id,
    })
    .addComponent({
      name: "name",
      value: input.name,
    });
  if (input.type === "production") {
    entity.addComponent(createProduction(input.time, input.pac));
  } else if (input.type === "storage") {
    entity.addComponent({
      name: "storageBonus",
      value: input.storage,
    });
  } else if (input.type === "teleport") {
    entity.addComponent({
      name: "teleport",
      destinationId: null,
    });
  }

  return entity as FacilityModule;
}

export function createFacilityModuleTemplate(input: FacilityModuleInput) {
  return {
    create: (sim: Sim, parent: Entity) =>
      createFacilityModule(sim, { ...input, parent }),
    ...input,
  };
}

export const facilityModules: Record<
  string,
  ReturnType<typeof createFacilityModuleTemplate>
> = {
  ...pipe(
    modules,
    map(
      ({ slug, ...rest }) =>
        // @ts-ignore
        [slug, createFacilityModuleTemplate({ slug, ...rest })] as const
    ),
    fromEntries
  ),
  // water: createFacilityModuleTemplate({
  //   name: "Water Production",
  //   slug: "waterProd",
  //   pac: {
  //     ice: { consumes: 4800, produces: 0 },
  //     water: { consumes: 0, produces: 2400 },
  //   },
  //   time: 2 * 60,
  //   type: "production",
  // }),
  // farm: createFacilityModuleTemplate({
  //   name: "Farm",
  //   slug: "farm",
  //   pac: {
  //     food: { consumes: 0, produces: 1300 },
  //     fuel: { consumes: 350, produces: 0 },
  //     water: { consumes: 700, produces: 0 },
  //   },
  //   time: 3 * 60,
  //   type: "production",
  // }),
  // refinery: createFacilityModuleTemplate({
  //   name: "Refinery",
  //   pac: {
  //     ore: { consumes: 4000, produces: 0 },
  //     metals: { consumes: 0, produces: 2000 },
  //   },
  //   time: 2.5 * 60,
  // }),
  // fuelFabrication: createFacilityModuleTemplate({
  //   name: "Fuel Fabrication",
  //   pac: {
  //     fuelium: { consumes: 4800, produces: 0 },
  //     fuel: { consumes: 0, produces: 2900 },
  //   },
  //   time: 3 * 60,
  // }),
  // habitat: createFacilityModuleTemplate({
  //   name: "Habitation Zone",
  //   pac: {
  //     food: { consumes: 400, produces: 0 },
  //     fuel: { consumes: 700, produces: 0 },
  //   },
  //   time: 2.5 * 60,
  // }),
  // hullPlates: createFacilityModuleTemplate({
  //   name: "Hull Plates Production",
  //   pac: {
  //     food: { consumes: 130, produces: 0 },
  //     fuel: { consumes: 1300, produces: 0 },
  //     metals: { consumes: 1600, produces: 0 },
  //     hullPlates: { consumes: 0, produces: 4600 },
  //   },
  //   time: 55,
  // }),
  // gold: createFacilityModuleTemplate({
  //   name: "Gold Refinery",
  //   pac: {
  //     goldOre: { consumes: 4700, produces: 0 },
  //     gold: { consumes: 0, produces: 6200 },
  //   },
  //   time: 230,
  // }),
  // silicon: createFacilityModuleTemplate({
  //   name: "Silicon Purification",
  //   pac: {
  //     silica: { consumes: 3600, produces: 0 },
  //     silicon: { consumes: 0, produces: 6000 },
  //   },
  //   time: 2 * 60,
  // }),
  // electronics: createFacilityModuleTemplate({
  //   name: "Electronics Production",
  //   pac: {
  //     food: { consumes: 600, produces: 0 },
  //     silicon: { consumes: 2000, produces: 0 },
  //     gold: { consumes: 1200, produces: 0 },
  //     electronics: { consumes: 0, produces: 600 },
  //     fuel: { consumes: 1050, produces: 0 },
  //   },
  //   time: 4 * 60,
  // }),
  // containerSmall: createFacilityModuleTemplate({
  //   name: "Small Container",
  //   storage: 4000,
  //   time: undefined,
  // }),
  // containerMedium: createFacilityModuleTemplate({
  //   name: "Medium Container",
  //   storage: 15000,
  //   time: undefined,
  // }),
} as const;
