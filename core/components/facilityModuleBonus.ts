import type { BaseComponent } from "./component";

export interface FacilityModuleBonus
  extends BaseComponent<"facilityModuleBonus"> {
  mood?: number;
  storage?: number;
  workers?: number;
}
