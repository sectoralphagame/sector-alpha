import { add, matrix, Matrix, random } from "mathjs";
import { limitMin } from "../utils/limit";
import { mineableCommodities } from "../economy/commodity";
import { createAsteroidField } from "../archetypes/asteroidField";
import { Sim } from "../sim";
import { createAsteroid } from "../archetypes/asteroid";

const getSize = () => (Math.random() < 0.1 ? random(6, 9) : random(2, 4));

export function getRandomAsteroidField() {
  const field = createAsteroidField(
    window.sim as Sim,
    mineableCommodities[
      Object.keys(mineableCommodities)[
        Math.floor(Object.keys(mineableCommodities).length * Math.random())
      ]
    ],
    getSize(),
    matrix([random(-80, 80), random(-80, 80)])
  );

  const asteroids = Math.round(
    limitMin(random(1, 4) * field.cp.asteroidSpawn.size, 1)
  );
  for (let i = 0; i < asteroids; i++) {
    const asteroidAngle = Math.random() * Math.PI;

    createAsteroid(
      window.sim as any,
      field,
      add(
        field.cp.position.coord,
        matrix([
          random(-field.cp.asteroidSpawn.size, field.cp.asteroidSpawn.size) *
            Math.cos(asteroidAngle),
          random(-field.cp.asteroidSpawn.size, field.cp.asteroidSpawn.size) *
            Math.sin(asteroidAngle),
        ])
      ) as Matrix
    );
  }
}
