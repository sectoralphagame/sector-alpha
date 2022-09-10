import { ShipInput } from "../world/ships";
import { BaseComponent } from "./component";

export interface Blueprints extends BaseComponent<"blueprints"> {
  ships: ShipInput[];
}
