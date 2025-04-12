import type { MineableCommodity } from "@core/economy/commodity";
import type { BaseComponent } from "./component";

export interface Mining extends BaseComponent<"mining"> {
  /**
   * Mined commodity per second
   */
  efficiency: number;

  /**
   * Mined entity ID
   */
  entityId: number | null;
  resource: MineableCommodity | null;
}

export function createMining(efficiency: number): Mining {
  return {
    name: "mining",
    efficiency,
    entityId: null,
    resource: null,
  };
}
