import type { BaseComponent } from "./component";
import type { TransformData } from "./transform";

export interface Position extends BaseComponent<"position">, TransformData {
  sector: number;
  moved: boolean;
}
