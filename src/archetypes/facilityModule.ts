import { Entity } from "../components/entity";
import { createProduction, PAC } from "../components/production";
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
  entity
    .addComponent({
      name: "parent",
      id: input.parent.id,
    })
    .addComponent({
      name: "name",
      value: input.name,
    });
  if (input.pac && input.time) {
    entity.addComponent(createProduction(input.time, input.pac));
  }

  if (input.storage) {
    entity.addComponent({
      name: "storageBonus",
      value: input.storage,
    });
  }

  return entity as FacilityModule;
}

export function createFacilityModuleTemplate(
  input: Omit<ProductionModuleInput, "parent">
) {
  return {
    create: (sim: Sim, parent: Entity) =>
      createFacilityModule(sim, { ...input, parent }),
    pac: input.pac,
    storage: input.storage,
    time: input.time,
  };
}

export const facilityModules = {
  water: createFacilityModuleTemplate({
    name: "Water Production",
    pac: {
      ice: { consumes: 4800, produces: 0 },
      water: { consumes: 0, produces: 2400 },
    },
    time: 2 * 60,
  }),
  farm: createFacilityModuleTemplate({
    name: "Farm",
    pac: {
      food: { consumes: 0, produces: 2700 },
      fuel: { consumes: 700, produces: 0 },
      water: { consumes: 1400, produces: 0 },
    },
    time: 3 * 60,
  }),
  refinery: createFacilityModuleTemplate({
    name: "Refinery",
    pac: {
      ore: { consumes: 4000, produces: 0 },
      metals: { consumes: 0, produces: 2000 },
    },
    time: 2.5 * 60,
  }),
  fuelFabrication: createFacilityModuleTemplate({
    name: "Fuel Fabrication",
    pac: {
      fuelium: { consumes: 4800, produces: 0 },
      fuel: { consumes: 0, produces: 2900 },
    },
    time: 3 * 60,
  }),
  habitat: createFacilityModuleTemplate({
    name: "Habitation Zone",
    pac: {
      food: { consumes: 900, produces: 0 },
      fuel: { consumes: 1300, produces: 0 },
    },
    time: 2.5 * 60,
  }),
  hullPlates: createFacilityModuleTemplate({
    name: "Hull Plates Production",
    pac: {
      food: { consumes: 130, produces: 0 },
      fuel: { consumes: 1300, produces: 0 },
      metals: { consumes: 1600, produces: 0 },
      hullPlates: { consumes: 0, produces: 4600 },
    },
    time: 55,
  }),
  shipyard: createFacilityModuleTemplate({
    name: "Shipyard",
    pac: {
      electronics: { consumes: 36000, produces: 0 },
      food: { consumes: 600, produces: 0 },
      fuel: { consumes: 900, produces: 0 },
      hullPlates: { consumes: 24000, produces: 0 },
    },
    time: 5 * 60,
  }),
  gold: createFacilityModuleTemplate({
    name: "Gold Refinery",
    pac: {
      goldOre: { consumes: 4700, produces: 0 },
      gold: { consumes: 0, produces: 6200 },
    },
    time: 230,
  }),
  silicon: createFacilityModuleTemplate({
    name: "Silicon Purification",
    pac: {
      silica: { consumes: 3600, produces: 0 },
      silicon: { consumes: 0, produces: 6000 },
    },
    time: 2 * 60,
  }),
  electronics: createFacilityModuleTemplate({
    name: "Electronics Production",
    pac: {
      food: { consumes: 2700, produces: 0 },
      silicon: { consumes: 13000, produces: 0 },
      gold: { consumes: 2400, produces: 0 },
      electronics: { consumes: 0, produces: 1200 },
      fuel: { consumes: 2100, produces: 0 },
    },
    time: 4 * 60,
  }),
  containerSmall: createFacilityModuleTemplate({
    name: "Small Container",
    storage: 4000,
    time: undefined,
  }),
  teleport: {
    create: (
      sim: Sim,
      parent: RequireComponent<"position" | "modules">
    ): FacilityModule => {
      const entity = new Entity(sim);
      entity
        .addComponent({ name: "parent", id: parent.id })
        .addComponent({
          name: "name",
          value: "Hyperspace Generator",
        })
        .addComponent({
          name: "teleport",
          destinationId: null,
        });

      return entity as FacilityModule;
    },
    pac: undefined,
    storage: undefined,
    time: undefined,
  },
} as const;
