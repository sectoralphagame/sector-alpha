import { BaseComponent } from "./component";

export interface Builder extends BaseComponent<"builder"> {
  targetId: number;
}
