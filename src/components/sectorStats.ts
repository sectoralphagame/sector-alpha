import { MineableCommodity } from "../economy/commodity";
import { BaseComponent } from "./component";

export interface SectorStats extends BaseComponent<"sectorStats"> {
  availableResources: Record<MineableCommodity, number[]>;
}
