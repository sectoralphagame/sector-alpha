import { ShipInput } from "../world/ships";
import { BaseComponent } from "./component";

export interface Shipyard extends BaseComponent<"shipyard"> {
  queue: ShipInput[];
}
