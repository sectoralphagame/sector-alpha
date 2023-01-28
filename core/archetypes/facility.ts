import Color from "color";
import { Matrix } from "mathjs";
import { createBudget } from "../components/budget";
import { Entity } from "../components/entity";
import { createRender } from "../components/render";
import { createCommodityStorage } from "../components/storage";
import { createTrade } from "../components/trade";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import { Sector } from "./sector";
import { createDocks } from "../components/dockable";
import { Faction } from "./faction";

export const commanderRange = 4;

export const facilityComponents = [
  "budget",
  "docks",
  "modules",
  "name",
  "position",
  "render",
  "journal",
  "selection",
  "storage",
  "trade",
] as const;

export type FacilityComponent = typeof facilityComponents[number];
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
      name: "position",
      angle: 0,
      coord: initial.position,
      sector: initial.sector.id,
      moved: false,
    })
    .addComponent(
      createRender({
        color: initial.owner?.cp.color.value
          ? Color(initial.owner?.cp.color.value).rgbNumber()
          : Color.hsl(0, 0, 70).rgbNumber(),
        defaultScale: 1,
        maxZ: 0.065,
        texture: "fFactory",
        zIndex: 1,
      })
    )
    .addComponent({ name: "selection" })
    .addComponent(createCommodityStorage())
    .addComponent(createTrade())
    .addComponent({ name: "journal", entries: [] });

  if (initial.owner) {
    entity.addComponent({
      name: "owner",
      id: initial.owner.id,
    });
  }

  return facility(entity);
}
