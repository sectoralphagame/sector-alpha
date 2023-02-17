import type { ShipInput } from "../world/ships";
import type { BaseComponent } from "./component";

export interface ShipyardQueueItem {
  /**
   * ID of faction requesting a ship
   */
  owner: number;
  blueprint: ShipInput;
}

export interface Shipyard extends BaseComponent<"shipyard"> {
  queue: ShipyardQueueItem[];
  building: ShipyardQueueItem | null;
}
