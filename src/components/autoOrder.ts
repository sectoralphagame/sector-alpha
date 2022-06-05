import { BaseComponent } from "./component";
import { Order } from "./orders";

export interface AutoOrder extends BaseComponent<"autoOrder"> {
  default: Order["type"];
}
