import type { Vec2 } from "ogl";
import type { BaseComponent } from "./component";

export interface TransformData {
  angle: number;
  readonly coord: Vec2;
}

/**
 * Local transform data for an entity. It is used for positioning and rotation
 * of children entities, such as turrets or other components that need to
 * inherit the position and rotation of their parent.
 */
export interface Transform extends BaseComponent<"transform">, TransformData {
  readonly world: TransformData;
}
