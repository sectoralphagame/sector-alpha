import { add, matrix, Matrix, random } from "mathjs";
import { limitMin } from "../utils/limit";
import { mineableCommodities } from "../economy/commodity";
import { createAsteroidField } from "../archetypes/asteroidField";
import { Sim } from "../sim";
import { createAsteroid } from "../archetypes/asteroid";
import { sectorSize } from "../archetypes/sector";

const getSize = () => (Math.random() < 0.1 ? random(6, 9) : random(2, 4));

export function getRandomAsteroidField() {
  const sectors = (window.sim as Sim).queries.sectors.get();
  const sector = sectors[Math.floor(sectors.length * Math.random())];

  const field = createAsteroidField(
    window.sim as Sim,
    mineableCommodities[
      Object.keys(mineableCommodities)[
        Math.floor(Object.keys(mineableCommodities).length * Math.random())
      ]
    ],
    getSize(),
    add(
      sector.cp.hecsPosition.toCartesian(sectorSize / 10),
      matrix([
        random(-sectorSize / 20, sectorSize / 20),
        random(-sectorSize / 20, sectorSize / 20),
      ])
    ) as Matrix
  );

  const asteroids = Math.round(
    limitMin(random(2, 6) * field.cp.asteroidSpawn.size, 1)
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
