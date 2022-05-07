import Color from "color";
import { Matrix } from "mathjs";
import { Budget } from "../components/budget";
import { Entity } from "../components/entity";
import { Modules } from "../components/modules";
import { Name } from "../components/name";
import { Owner } from "../components/owner";
import { Position } from "../components/position";
import { CompoundProduction } from "../components/production";
import { Render } from "../components/render";
import { Selection } from "../components/selection";
import { CommodityStorage } from "../components/storage";
import { Trade } from "../components/trade";
import { Faction } from "../economy/faction";
import fCivTexture from "../../assets/f_civ.svg";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import { Sector } from "./sector";

export const facilityComponents = [
  "budget",
  "compoundProduction",
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

  entity.addComponent("budget", new Budget());
  entity.addComponent("compoundProduction", new CompoundProduction());
  entity.addComponent("modules", new Modules());
  entity.addComponent("name", new Name(`Facility #${entity.id}`));
  entity.addComponent("owner", new Owner(initial.owner));
  entity.addComponent(
    "position",
    new Position(initial.position, 0, initial.sector)
  );
  entity.addComponent(
    "render",
    new Render({
      color: Color(initial.owner.color).rgbNumber(),
      defaultScale: 1,
      maxZ: 0.1,
      pathToTexture: fCivTexture,
      zIndex: 1,
    })
  );
  entity.addComponent("selection", new Selection());
  entity.addComponent("storage", new CommodityStorage());
  entity.addComponent("trade", new Trade());

  return facility(entity);
}
