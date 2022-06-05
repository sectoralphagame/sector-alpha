import Color from "color";
import { Matrix } from "mathjs";
import { createBudget } from "../components/budget";
import { Entity } from "../components/entity";
import { createCompoundProduction } from "../components/production";
import { createRender } from "../components/render";
import { createCommodityStorage } from "../components/storage";
import { createTrade } from "../components/trade";
import { Faction } from "../economy/faction";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import { Sector } from "./sector";
import { createDocks } from "../components/dockable";

export const commanderRange = 2;

export const facilityComponents = [
  "budget",
  "compoundProduction",
  "docks",
  "modules",
  "name",
  "owner",
  "position",
  "render",
  "selection",
  "storage",
  "trade",
] as const;

// Ugly hack to transform facilityComponents array type to string union
const widenType = [...facilityComponents][0];
export type FacilityComponent = typeof widenType;
export type Facility = RequireComponent<FacilityComponent>;

export function facility(entity: Entity): Facility {
  return entity.requireComponents(facilityComponents);
}

export interface InitialFacilityInput {
  position: Matrix;
  owner: Faction;
  sector: Sector;
}

export function createFacility(sim: Sim, initial: InitialFacilityInput) {
  const entity = new Entity(sim);

  entity
    .addComponent(createBudget())
    .addComponent(createCompoundProduction())
    .addComponent(createDocks({ large: 1, medium: 3, small: 3 }))
    .addComponent({
      name: "modules",
      ids: [],
    })
    .addComponent({
      name: "name",
      value: `Facility #${entity.id}`,
    })
    .addComponent({
      name: "owner",
      value: initial.owner,
    })
    .addComponent({
      name: "position",
      angle: 0,
      coord: initial.position,
      sector: initial.sector.id,
    })
    .addComponent(
      createRender({
        color: Color(initial.owner.color).rgbNumber(),
        defaultScale: 1,
        maxZ: 0.1,
        texture: "fCiv",
        zIndex: 1,
      })
    )
    .addComponent({ name: "selection" })
    .addComponent(createCommodityStorage())
    .addComponent(createTrade());

  return facility(entity);
}
