import {
  add,
  matrix,
  Matrix,
  multiply,
  random,
  randomInt,
  subtract,
} from "mathjs";
import { mineableCommodities, MineableCommodity } from "./commodity";

export interface FocusPoint {
  position: Matrix;
  size: number;
}

export interface Asteroid {
  mined: number | null;
  position: Matrix;
}

export class Field {
  focus: FocusPoint[] = [];
  outline: Matrix[] = [];
  type: MineableCommodity;
  rocks: Asteroid[];

  constructor(type: MineableCommodity) {
    this.type = type;
  }
}

const getSize = () => (Math.random() < 0.1 ? random(1, 3) : random(0.25, 1));

export function getRandomField(): Field {
  const field = new Field(
    mineableCommodities[
      Object.keys(mineableCommodities)[
        Math.floor(Object.keys(mineableCommodities).length * Math.random())
      ]
    ]
  );

  const numberOfPoints = random(2, 11);

  field.focus.push({
    position: matrix([random(-80, 80), random(-80, 80)]),
    size: getSize(),
  });
  let angle = Math.random() * 2 * Math.PI;

  const sideA: Matrix[] = [
    subtract(
      field.focus[0].position,
      multiply(matrix([Math.cos(angle), Math.sin(angle)]), field.focus[0].size)
    ) as Matrix,
    add(
      field.focus[0].position,
      multiply(
        matrix([Math.cos(angle + Math.PI / 2), Math.sin(angle + Math.PI / 2)]),
        field.focus[0].size
      )
    ) as Matrix,
  ];
  const sideB: Matrix[] = [
    add(
      field.focus[0].position,
      multiply(
        matrix([Math.cos(angle - Math.PI / 2), Math.sin(angle - Math.PI / 2)]),
        field.focus[0].size
      )
    ) as Matrix,
  ];

  for (let i = 0; i < numberOfPoints; i++) {
    const size = getSize();
    const position = add(
      field.focus[i].position,
      multiply(
        matrix([Math.cos(angle), Math.sin(angle)]),
        size + field.focus[i].size
      )
    ) as Matrix;
    field.focus.push({
      position,
      size,
    });

    angle += random(-Math.PI / 4, Math.PI / 4);

    sideA.push(
      add(
        field.focus[i + 1].position,
        multiply(
          matrix([
            Math.cos(angle + Math.PI / 2),
            Math.sin(angle + Math.PI / 2),
          ]),
          field.focus[i + 1].size
        )
      ) as Matrix
    );

    sideB.push(
      add(
        field.focus[i + 1].position,
        multiply(
          matrix([
            Math.cos(angle - Math.PI / 2),
            Math.sin(angle - Math.PI / 2),
          ]),
          field.focus[i + 1].size
        )
      ) as Matrix
    );
  }

  sideA.push(
    add(
      field.focus.at(-1).position,
      multiply(
        matrix([Math.cos(angle), Math.sin(angle)]),
        field.focus.at(-1).size
      )
    ) as Matrix
  );

  field.outline = [...sideA, ...sideB.reverse()];

  field.rocks = field.focus
    .map((p) =>
      Array(Math.round(random(1, 3) * p.size * 3))
        .fill(0)
        .map(() => {
          const asteroidAngle = Math.random() * Math.PI;

          return {
            mined: null,
            position: add(
              p.position,
              matrix([
                random(-p.size, p.size) * Math.cos(asteroidAngle),
                random(-p.size, p.size) * Math.sin(asteroidAngle),
              ])
            ) as Matrix,
          };
        })
    )
    .flat();

  return field;
}
