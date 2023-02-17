import type { BaseComponent } from "./component";
import type { Action } from "./orders";

export interface AutoOrder extends BaseComponent<"autoOrder"> {
  default: Action["type"];
}
