import { MineableCommodity } from "../economy/commodity";

export class AsteroidSpawn {
  type: MineableCommodity;
  size: number;

  constructor(type: MineableCommodity, size: number) {
    this.type = type;
    this.size = size;
  }
}
