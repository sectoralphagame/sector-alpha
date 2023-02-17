import type { Facility } from "@core/archetypes/facility";
import type { FacilityModuleInput } from "@core/archetypes/facilityModule";
import type { BaseComponent } from "./component";

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
