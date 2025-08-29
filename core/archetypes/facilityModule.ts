import type { Commodity } from "@core/economy/commodity";
import { fromEntries, pipe, map } from "@fxts/core";
import type { Damage } from "@core/components/damage";
import { fromPolar } from "@core/utils/misc";
import { findInAncestors } from "@core/utils/findInAncestors";
import { Entity } from "../entity";
import type { PAC } from "../components/production";
import { createProduction } from "../components/production";
import type { Sim } from "../sim";
import type { RequireComponent } from "../tsHelpers";
import modules from "../world/data/facilityModules.json";
import { createTurret } from "./turret";

export interface FacilityModuleCommonInput {
  name: string;
  slug: string;
  build: {
    cost: Partial<Record<Commodity, number>>;
    time: number;
  };
  crew: {
    cost: number;
  };
}
export interface ProductionFacilityModuleInput
  extends FacilityModuleCommonInput {
  pac: Partial<PAC>;
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
  crew: {
    cost: 0;
    capacity: number;
  };
  type: "habitat";
}
export interface HubFacilityModuleInput extends FacilityModuleCommonInput {
  pac: Partial<PAC>;
  type: "hub";
}
export interface MilitaryFacilityModuleInput extends FacilityModuleCommonInput {
  damage: Omit<Damage, "name">;
  type: "military";
}
export interface SpecialFacilityModuleInput extends FacilityModuleCommonInput {
  type: "special";
}
export type FacilityModuleInput =
  | ProductionFacilityModuleInput
  | StorageFacilityModuleInput
  | ShipyardFacilityModuleInput
  | TeleportFacilityModuleInput
  | HabitatFacilityModuleInput
  | MilitaryFacilityModuleInput
  | HubFacilityModuleInput
  | SpecialFacilityModuleInput;

export type FacilityModuleType = FacilityModuleInput["type"];
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
      slug: input.slug,
    })
    .addTag("facilityModule")
    .addTag(`facilityModuleType:${input.type}`);
  if (input.type === "habitat") {
    entity.addComponent({
      name: "facilityModuleBonus",
      workers: input.crew.capacity,
    });
  }
  if (input.type === "production" || input.type === "hub") {
    entity.addComponent(createProduction(input.pac));
  } else if (input.type === "storage") {
    entity.addComponent({
      name: "facilityModuleBonus",
      storage: input.storage,
    });
  } else if (input.type === "teleport") {
    entity.addComponent({
      name: "teleport",
      destinationId: null,
    });
  } else if (input.type === "military") {
    entity.addComponent({
      name: "children",
      entities: [],
      slots: Array(4)
        .fill(0)
        .map((_, i) => ({
          angle: (i * Math.PI) / 2,
          slug: `turret-${i}`,
        })),
    });
    const turrets = Array(4)
      .fill(0)
      .map((_, i) =>
        createTurret(sim, {
          slug: "rapidKinetic",
          angle: (i * Math.PI) / 2,
          damage: {
            angle: Math.PI / 2,
          },
          slot: `turret-${i}`,
          parentId: entity.id,
          transform: {
            coord: fromPolar((i * Math.PI) / 2, 0.01),
            angle: (i * Math.PI) / 2,
            world: {
              coord: findInAncestors(input.parent, "position")
                .cp.position.coord.clone()
                .add(fromPolar((i * Math.PI) / 2, 0.01)),
              angle: (i * Math.PI) / 2,
            },
          },
        })
      );
    entity.cp.children!.entities = turrets.map((turret, turretIndex) => ({
      id: turret.id,
      role: "turret",
      slot: `turret-${turretIndex}`,
    }));
  }
  if (input.crew.cost > 0) {
    entity.addComponent({
      name: "crewRequirement",
      value: input.crew.cost,
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
> = pipe(
  modules,
  map(
    ({ slug, ...rest }) =>
      // @ts-ignore
      [slug, createFacilityModuleTemplate({ slug, ...rest })] as const
  ),
  fromEntries
);
