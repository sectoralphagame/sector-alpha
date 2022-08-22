import { Matrix } from "mathjs";
import { BaseComponent } from "./component";

export interface Position extends BaseComponent<"position"> {
  angle: number;
  coord: Matrix;
  sector: number;
  moved: boolean;
}
