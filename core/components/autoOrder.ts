import { BaseComponent } from "./component";
import { Action } from "./orders";

export interface AutoOrder extends BaseComponent<"autoOrder"> {
  default: Action["type"];
}
