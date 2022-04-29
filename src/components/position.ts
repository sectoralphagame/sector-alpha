import { matrix, Matrix } from "mathjs";

export class Position {
  angle: number;
  coord: Matrix;

  constructor(value: Matrix, angle: number) {
    this.coord = matrix(value);
    this.angle = angle;
  }

  get x() {
    return this.coord.get([0]);
  }

  get y() {
    return this.coord.get([1]);
  }
}
