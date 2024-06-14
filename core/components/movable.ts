import type { BaseComponent } from "./component";

export interface Movable extends BaseComponent<"movable"> {
  acceleration: number;
  velocity: number;
  /**
   * Expressed in radians per second
   */
  rotary: number;
}
