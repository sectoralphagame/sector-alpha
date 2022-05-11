import { MineableCommodity } from "../economy/commodity";
import { MissingEntityError } from "../errors";
import { Sim } from "../sim";
import { Entity } from "./entity";

export class Minable {
  commodity: MineableCommodity;
  minedBy: Entity | null;
  minedById: number | null;

  constructor(commodity: MineableCommodity) {
    this.commodity = commodity;
  }

  load = (sim: Sim) => {
    if (this.minedById) {
      const entity = sim.entities.find((e) => e.id === this.minedById);
      if (entity === undefined) {
        throw new MissingEntityError(this.minedById);
      }
      this.minedBy = entity;
    }
  };

  setMinedBy = (entity: Entity) => {
    this.minedBy = entity;
    this.minedById = entity.id;
  };

  clearMinedBy = () => {
    this.minedBy = null;
    this.minedById = null;
  };
}
