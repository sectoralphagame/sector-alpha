import type { MineableCommodity } from "@core/economy/commodity";
import type { BaseComponent } from "./component";

export interface Mining extends BaseComponent<"mining"> {
  /**
   * Mined commodity per second
   */
  efficiency: number;

  /**
   * Storage is limited to non-fraction quantities so we're buffering it and
   * move to storage every 2 seconds
   */
  buffer: number;

  /**
   * Mined entity ID
   */
  entityId: number | null;
  resource: MineableCommodity;
}

export function createMining(efficiency: number): Mining {
  return {
    name: "mining",
    buffer: 0,
    efficiency,
    entityId: null,
    resource: "fuelium",
  };
}
