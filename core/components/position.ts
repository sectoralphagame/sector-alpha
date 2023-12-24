import type { BaseComponent } from "./component";

export type Position2D = [number, number];

export interface Position extends BaseComponent<"position"> {
  angle: number;
  coord: Position2D;
  sector: number;
  moved: boolean;
}
