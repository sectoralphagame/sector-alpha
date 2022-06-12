import { MineableCommodity } from "../economy/commodity";
import { BaseComponent } from "./component";

export interface AsteroidSpawn extends BaseComponent<"asteroidSpawn"> {
  type: MineableCommodity;
  asteroidResources: Record<"min" | "max", number>;
  density: number;
  size: number;
}
