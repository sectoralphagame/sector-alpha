import { matrix, Matrix, multiply } from "mathjs";

export class HECSPosition {
  value: Matrix;

  constructor(value: Matrix) {
    this.value = value;
  }

  toCartesian = (scale: number): Matrix =>
    multiply(
      multiply(
        matrix([
          [1 / 2, 0, 1],
          [Math.sqrt(3) / 2, Math.sqrt(3), 0],
        ]),
        this.value
      ),
      scale
    );

  se = (): Matrix =>
    matrix([
      1 - this.value.get([0]),
      this.value.get([0]) + this.value.get([1]),
      this.value.get([0]) + this.value.get([2]),
    ]);
  e = (): Matrix =>
    matrix([this.value.get([0]), this.value.get([1]), this.value.get([2]) + 1]);
  ne = (): Matrix =>
    matrix([
      1 - this.value.get([0]),
      this.value.get([0]) + this.value.get([1]) - 1,
      this.value.get([0]) + this.value.get([2]),
    ]);
  nw = (): Matrix =>
    matrix([
      1 - this.value.get([0]),
      this.value.get([0]) + this.value.get([1]) - 1,
      this.value.get([0]) + this.value.get([2]) - 1,
    ]);
  w = (): Matrix =>
    matrix([this.value.get([0]), this.value.get([1]), this.value.get([2]) - 1]);
  sw = (): Matrix =>
    matrix([
      1 - this.value.get([0]),
      this.value.get([0]) + this.value.get([1]),
      this.value.get([0]) + this.value.get([2]) - 1,
    ]);
}
