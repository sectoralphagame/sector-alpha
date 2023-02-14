import { FacilityModuleInput } from "@core/archetypes/facilityModule";
import { BaseComponent } from "./component";

export interface FacilityModuleQueueItem {
  blueprint: FacilityModuleInput;
}

export interface FacilityModuleQueue
  extends BaseComponent<"facilityModuleQueue"> {
  queue: FacilityModuleQueueItem[];
  building: FacilityModuleQueueItem | null;
}
