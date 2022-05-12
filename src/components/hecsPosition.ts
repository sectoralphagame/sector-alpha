import { add, matrix, Matrix, multiply, subtract, sum } from "mathjs";

export class HECSPosition {
  value: Matrix;

  constructor(value: Matrix) {
    this.value = value;
  }

  static round = (hex: Matrix) => {
    const rounded = hex.map(Math.round);
    const diff = (subtract(hex, rounded) as Matrix).map(Math.abs);

    if (diff.get([0]) > diff.get([1]) && diff.get([0]) > diff.get([2])) {
      rounded.set([0], -rounded.get([1]) - rounded.get([2]));
    } else if (diff.get([1]) > diff.get([2])) {
      rounded.set([1], -rounded.get([0]) - rounded.get([2]));
    } else {
      rounded.set([2], -rounded.get([0]) - rounded.get([1]));
    }

    return rounded;
  };

  toCartesian = (scale: number): Matrix =>
    multiply(
      multiply(
        matrix([
          [3 / 2, 0],
          [Math.sqrt(3) / 2, Math.sqrt(3)],
        ]),
        this.value.resize([2])
      ),
      scale
    );

  distance = (pos: Matrix): number =>
    sum((subtract(this.value, pos) as Matrix).map(Math.abs)) / 2;

  se = (): Matrix => add(this.value, matrix([0, 1, -1])) as Matrix;
  e = (): Matrix => add(this.value, matrix([1, 0, -1])) as Matrix;
  ne = (): Matrix => add(this.value, matrix([1, -1, 0])) as Matrix;
  nw = (): Matrix => add(this.value, matrix([0, -1, 1])) as Matrix;
  w = (): Matrix => add(this.value, matrix([-1, 0, 1])) as Matrix;
  sw = (): Matrix => add(this.value, matrix([-1, 1, 0])) as Matrix;
}
