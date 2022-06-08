import { add, matrix, Matrix, random } from "mathjs";
import { limitMin } from "../utils/limit";
import { mineableCommodities } from "../economy/commodity";
import { createAsteroidField } from "../archetypes/asteroidField";
import { Sim } from "../sim";
import { createAsteroid } from "../archetypes/asteroid";
import { sectorSize } from "../archetypes/sector";
import { hecsToCartesian } from "../components/hecsPosition";

const getSize = () => {
  const r = Math.random();

  if (r < 0.05) {
    return random(7, 12);
  }
  if (r < 0.15) {
    return random(4, 7);
  }

  return random(1, 3);
};

export function getRandomAsteroidField() {
  const sectors = (window.sim as Sim).queries.sectors.get();
  const sector = sectors[Math.floor(sectors.length * Math.random())];
  const maxR = (sectorSize / 20) * Math.sqrt(3);

  const sectorCenterPosition = hecsToCartesian(
    sector.cp.hecsPosition.value,
    sectorSize / 10
  );
  const size = getSize();
  const polarPosition = {
    r: random(0, maxR - size - 0.5),
    a: random(-Math.PI, Math.PI),
  };
  const position = add(
    matrix([
      polarPosition.r * Math.cos(polarPosition.a),
      polarPosition.r * Math.sin(polarPosition.a),
    ]),
    sectorCenterPosition
  ) as Matrix;

  const field = createAsteroidField(
    window.sim as Sim,
    mineableCommodities[
      Object.keys(mineableCommodities)[
        Math.floor(Object.keys(mineableCommodities).length * Math.random())
      ]
    ],
    size,
    position,
    sector
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
      ) as Matrix,
      sector
    );
  }
}
