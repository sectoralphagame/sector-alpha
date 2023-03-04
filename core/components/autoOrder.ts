import type { BaseComponent } from "./component";
import type { Order } from "./orders";

export interface AutoOrder extends BaseComponent<"autoOrder"> {
  default: Order["type"];
}
