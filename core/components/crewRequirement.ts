import type { BaseComponent } from "./component";

export interface CrewRequirement extends BaseComponent<"crewRequirement"> {
  value: number;
}
