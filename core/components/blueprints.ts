import type { FacilityModuleInput } from "@core/archetypes/facilityModule";
import type { ShipInput } from "../world/ships";
import type { BaseComponent } from "./component";

export interface Blueprints extends BaseComponent<"blueprints"> {
  facilityModules: FacilityModuleInput[];
  ships: ShipInput[];
}
