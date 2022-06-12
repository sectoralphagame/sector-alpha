import { add, matrix, Matrix, random } from "mathjs";
import { mineableCommodities, MineableCommodity } from "../economy/commodity";
import { createAsteroidField } from "../archetypes/asteroidField";
import { Sim } from "../sim";
import { sectorSize } from "../archetypes/sector";
import { hecsToCartesian } from "../components/hecsPosition";
import { pickRandom } from "../utils/generators";

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

const densities: Record<MineableCommodity, [number, number]> = {
  fuelium: [1000, 4000],
  goldOre: [100, 500],
  ore: [500, 6500],
  ice: [100, 900],
  silica: [200, 750],
};
const resourcesPerAsteroid: Record<MineableCommodity, [number, number]> = {
  fuelium: [500, 800],
  goldOre: [50, 110],
  ore: [400, 900],
  ice: [90, 300],
  silica: [200, 450],
};
const getDensity = (type: MineableCommodity) => random(...densities[type]);

export function getRandomAsteroidField() {
  const sectors = (window.sim as Sim).queries.sectors.get();
  const sector = pickRandom(sectors);
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
  const mineable =
    mineableCommodities[
      Object.keys(mineableCommodities)[
        Math.floor(Object.keys(mineableCommodities).length * Math.random())
      ]
    ];

  createAsteroidField(window.sim as Sim, position, sector, {
    asteroidResources: {
      max: resourcesPerAsteroid[mineable][1],
      min: resourcesPerAsteroid[mineable][0],
    },
    density: getDensity(mineable),
    size: getSize(),
    type: mineable,
  });
}
