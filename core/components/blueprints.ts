import { FacilityModuleInput } from "@core/archetypes/facilityModule";
import { ShipInput } from "../world/ships";
import { BaseComponent } from "./component";

export interface Blueprints extends BaseComponent<"blueprints"> {
  facilityModules: FacilityModuleInput[];
  ships: ShipInput[];
}
