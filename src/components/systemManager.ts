import { BaseComponent } from "./component";

export interface SystemManager extends BaseComponent<"systemManager"> {
  lastStatUpdate: number;
  lastInflationStatUpdate: number;
}
