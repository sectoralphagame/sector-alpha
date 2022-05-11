import { matrix, Matrix } from "mathjs";

export class Position {
  value: Matrix;

  constructor(value?: Matrix) {
    this.value = matrix(value ?? [0, 0]);
  }

  get x() {
    return this.value.get([0]);
  }

  get y() {
    return this.value.get([1]);
  }
}
