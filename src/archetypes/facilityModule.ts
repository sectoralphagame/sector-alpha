import { Entity } from "../components/entity";
import { Name } from "../components/name";
import { Parent } from "../components/parent";
import { PAC, Production } from "../components/production";
import { StorageBonus } from "../components/storageBonus";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";

export interface ProductionModuleInput {
  name: string;
  pac?: Partial<PAC>;
  parent: Entity;
  storage?: number;
  time?: number;
}

export type FacilityModule = RequireComponent<"parent" | "name">;

export function createFacilityModule(sim: Sim, input: ProductionModuleInput) {
  const entity = new Entity(sim);
  entity.addComponent("parent", new Parent(input.parent));
  entity.addComponent("name", new Name(input.name));
  if (input.pac && input.time) {
    entity.addComponent("production", new Production(input.time, input.pac));
  }

  if (input.storage) {
    entity.addComponent("storageBonus", new StorageBonus(input.storage));
  }

  return entity as FacilityModule;
}

export function createFacilityModuleTemplate(
  input: Omit<ProductionModuleInput, "parent">
) {
  return (sim: Sim, parent: Entity) =>
    createFacilityModule(sim, { ...input, parent });
}

export const facilityModules = {
  water: createFacilityModuleTemplate({
    name: "Water Production",
    pac: {
      ice: { consumes: 20, produces: 0 },
      water: { consumes: 0, produces: 10 },
    },
    time: 15,
  }),
  farm: createFacilityModuleTemplate({
    name: "Farm",
    pac: {
      food: { consumes: 0, produces: 15 },
      fuel: { consumes: 1, produces: 0 },
      water: { consumes: 30, produces: 0 },
    },
    time: 15,
  }),
  refinery: createFacilityModuleTemplate({
    name: "Refinery",
    pac: {
      food: { consumes: 2, produces: 0 },
      ore: { consumes: 20, produces: 0 },
      metals: { consumes: 0, produces: 15 },
      fuel: { consumes: 2, produces: 0 },
    },
    time: 15,
  }),
  fuelFabrication: createFacilityModuleTemplate({
    name: "Fuel Fabrication",
    pac: {
      fuelium: { consumes: 20, produces: 0 },
      fuel: { consumes: 0, produces: 10 },
    },
    time: 15,
  }),
  habitat: createFacilityModuleTemplate({
    name: "Habitation Zone",
    pac: {
      food: { consumes: 5, produces: 0 },
    },
    time: 15,
  }),
  hullPlates: createFacilityModuleTemplate({
    name: "Hull Plates Production",
    pac: {
      food: { consumes: 2, produces: 0 },
      fuel: { consumes: 7, produces: 0 },
      metals: { consumes: 25, produces: 0 },
      hullPlates: { consumes: 0, produces: 70 },
    },
    time: 24,
  }),
  shipyard: createFacilityModuleTemplate({
    name: "Shipyard",
    pac: {
      food: { consumes: 10, produces: 0 },
      fuel: { consumes: 15, produces: 0 },
      hullPlates: { consumes: 400, produces: 0 },
    },
    time: 60,
  }),
  containerSmall: createFacilityModuleTemplate({
    name: "Small Container",
    storage: 1000,
  }),
} as const;
