import { MineableCommodity } from "../economy/commodity";
import { BaseComponent } from "./component";

export interface Minable extends BaseComponent<"minable"> {
  minedById: number | null;
  commodity: MineableCommodity;
  resources: number;
}
