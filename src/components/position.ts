import { matrix, Matrix } from "mathjs";
import { sector as asSector, Sector } from "../archetypes/sector";
import { MissingEntityError } from "../errors";
import { Sim } from "../sim";

export class Position {
  angle: number;
  coord: Matrix;
  sector: Sector;
  sectorId: number;

  constructor(value: Matrix, angle: number, sector: Sector) {
    this.coord = matrix(value);
    this.angle = angle;
    this.sector = sector;
    this.sectorId = sector.id;
  }

  get x() {
    return this.coord.get([0]);
  }

  get y() {
    return this.coord.get([1]);
  }

  load = (sim: Sim) => {
    const entity = sim.entities.find((e) => e.id === this.sectorId);
    if (!entity) {
      throw new MissingEntityError(this.sectorId);
    }
    this.sector = asSector(entity);
  };
}
