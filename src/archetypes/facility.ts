import { Budget } from "../components/budget";
import { Entity } from "../components/entity";
import { Modules } from "../components/modules";
import { Name } from "../components/name";
import { Owner } from "../components/owner";
import { Position } from "../components/position";
import { CompoundProduction } from "../components/production";
import { Render } from "../components/render";
import { Selection } from "../components/selection/selection";
import { CommodityStorage } from "../components/storage";
import { Trade } from "../components/trade";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";

export type Facility = RequireComponent<
  | "budget"
  | "compoundProduction"
  | "modules"
  | "name"
  | "owner"
  | "position"
  | "selection"
  | "storage"
  | "trade"
>;

export function createFacility(sim: Sim) {
  const facility = new Entity(sim);

  facility.components = {
    budget: new Budget(),
    compoundProduction: new CompoundProduction(),
    modules: new Modules(),
    name: new Name(`Facility #${facility.id}`),
    owner: new Owner(),
    position: new Position(),
    render: new Render(2, 0.7),
    selection: new Selection(),
    storage: new CommodityStorage(),
    trade: new Trade(),
  };

  return facility as Facility;
}
