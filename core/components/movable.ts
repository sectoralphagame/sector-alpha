import type { Vec2 } from "ogl";
import type { BaseComponent } from "./component";

export interface Movable extends BaseComponent<"movable"> {
  acceleration: Vec2;
  velocity: Vec2;
  /**
   * Expressed in radians per second
   */
  rotary: number;
  drag: number;
}
