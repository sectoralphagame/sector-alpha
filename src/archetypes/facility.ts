import { Budget } from "../components/budget";
import { CoreComponents, Entity } from "../components/entity";
import { Modules } from "../components/modules";
import { Name } from "../components/name";
import { Owner } from "../components/owner";
import { Position } from "../components/position";
import { CompoundProduction } from "../components/production";
import { Render } from "../components/render";
import { Selection } from "../components/selection";
import { CommodityStorage } from "../components/storage";
import { Trade } from "../components/trade";
import { MissingComponentError } from "../errors";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";

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

// Ugly hack to transfform facilityComponents array type to string union
const widenType = [...facilityComponents][0];
export type FacilityComponent = typeof widenType;
export type Facility = RequireComponent<FacilityComponent>;

export function createFacility(sim: Sim) {
  const entity = new Entity(sim);

  const components: Pick<CoreComponents, FacilityComponent> = {
    budget: new Budget(),
    compoundProduction: new CompoundProduction(),
    modules: new Modules(),
    name: new Name(`Facility #${entity.id}`),
    owner: new Owner(),
    position: new Position(),
    render: new Render(2, 0.7),
    selection: new Selection(),
    storage: new CommodityStorage(),
    trade: new Trade(),
  };
  entity.components = components;

  return entity as Facility;
}

export function facility(entity: Entity): Facility {
  if (!entity.hasComponents(facilityComponents)) {
    throw new MissingComponentError(entity, facilityComponents);
  }

  return entity as Facility;
}
