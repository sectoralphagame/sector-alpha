import { Asteroid } from "../economy/field";
import { Cooldowns } from "../utils/cooldowns";

export class Mining {
  /**
   * Mined commodity per second
   */
  efficiency: number;

  /**
   * Storage is limited to non-fraction quantities so we're buffering it and
   * move to storage every 2 seconds
   */
  buffer: number = 0;

  asteroid: Asteroid | null = null;
  cooldowns: Cooldowns<"mine">;

  constructor(efficiency: number) {
    this.efficiency = efficiency;
    this.cooldowns = new Cooldowns("mine");
  }
}
