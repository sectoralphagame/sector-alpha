import { Facility } from "@core/archetypes/facility";
import { FacilityModuleInput } from "@core/archetypes/facilityModule";
import { BaseComponent } from "./component";

export interface FacilityModuleQueueItem {
  blueprint: FacilityModuleInput;
}

export interface FacilityModuleCurrentItem {
  blueprint: FacilityModuleInput;
  progress: number;
}

export interface FacilityModuleQueue
  extends BaseComponent<"facilityModuleQueue"> {
  queue: FacilityModuleQueueItem[];
  building: FacilityModuleCurrentItem | null;
}

export function clearBuiltModule(facility: Facility) {
  facility.cp.facilityModuleQueue.building = null;
}
