import { MineableCommodity } from "../economy/commodity";
import { BaseComponent } from "./component";

export interface AsteroidSpawn extends BaseComponent<"asteroidSpawn"> {
  type: MineableCommodity;
  size: number;
}
