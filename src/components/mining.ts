import { BaseComponent } from "./component";
import { EntityId } from "./utils/entityId";

export interface Mining extends BaseComponent<"mining">, EntityId {
  /**
   * Mined commodity per second
   */
  efficiency: number;

  /**
   * Storage is limited to non-fraction quantities so we're buffering it and
   * move to storage every 2 seconds
   */
  buffer: number;
}

export function createMining(efficiency: number): Mining {
  return {
    name: "mining",
    buffer: 0,
    efficiency,
    entity: null,
    entityId: null,
  };
}
