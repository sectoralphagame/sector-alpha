import type { Matrix } from "mathjs";
import { add, matrix, multiply, subtract, sum } from "mathjs";
import { sectorSize } from "../archetypes/sector";
import type { BaseComponent } from "./component";

export const transforms = {
  s: matrix([0, 1, -1]),
  se: matrix([1, 0, -1]),
  ne: matrix([1, -1, 0]),
  n: matrix([0, -1, 1]),
  nw: matrix([-1, 0, 1]),
  sw: matrix([-1, 1, 0]),
};

export interface HECSPosition extends BaseComponent<"hecsPosition"> {
  /**
   * Cube coordinates as [q, r, s]
   * https://www.redblobgames.com/grids/hexagons/#coordinates-cube
   */
  value: Matrix;
}

export function axialToCube(axial: Matrix): Matrix {
  return matrix([
    ...(axial.toArray() as number[]),
    -(axial.get([0]) + axial.get([1])),
  ]);
}

export function hecsMove(
  position: Matrix,
  direction: keyof typeof transforms
): Matrix {
  return add(position, transforms[direction]) as Matrix;
}

export function hecsDistance(a: Matrix, b: Matrix): number {
  return sum((subtract(a, b) as Matrix).map(Math.abs)) / 2;
}

export function hecsRound(position: Matrix): Matrix {
  const rounded = position.map(Math.round);
  const diff = (subtract(position, rounded) as Matrix).map(Math.abs);

  if (diff.get([0]) > diff.get([1]) && diff.get([0]) > diff.get([2])) {
    rounded.set([0], -rounded.get([1]) - rounded.get([2]));
  } else if (diff.get([1]) > diff.get([2])) {
    rounded.set([1], -rounded.get([0]) - rounded.get([2]));
  } else {
    rounded.set([2], -rounded.get([0]) - rounded.get([1]));
  }

  return rounded;
}

export function hecsToCartesian(position: Matrix, scale: number): Matrix {
  return multiply(
    multiply(
      matrix([
        [3 / 2, 0],
        [Math.sqrt(3) / 2, Math.sqrt(3)],
      ]),
      position.clone().resize([2])
    ),
    scale
  );
}

export function cartesianToHecs(position: Matrix, scale: number): Matrix {
  return axialToCube(
    multiply(
      multiply(
        matrix([
          [2 / 3, 0],
          [-1 / 3, Math.sqrt(3) / 3],
        ]),
        position.clone().resize([2])
      ),
      scale
    )
  );
}

export function worldToHecs(coords: number[]): Matrix {
  return hecsRound(cartesianToHecs(matrix(coords), 10 / sectorSize));
}
