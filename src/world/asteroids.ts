import { add, matrix, Matrix, random } from "mathjs";
import { mineableCommodities, MineableCommodity } from "../economy/commodity";
import { createAsteroidField } from "../archetypes/asteroidField";
import { Sim } from "../sim";
import { Sector, sectorSize } from "../archetypes/sector";
import { hecsToCartesian } from "../components/hecsPosition";
import { pickRandom } from "../utils/generators";

const getSize = () => {
  const r = Math.random();

  if (r < 0.05) {
    return random(10, 14);
  }
  if (r < 0.75) {
    return random(1, 4);
  }

  return random(5, 9);
};

const densities: Record<MineableCommodity, [number, number]> = {
  fuelium: [100, 600],
  goldOre: [25, 125],
  ore: [125, 1100],
  ice: [25, 300],
  silica: [50, 300],
};
const resourcesPerAsteroid: Record<MineableCommodity, [number, number]> = {
  fuelium: [200, 400],
  goldOre: [50, 110],
  ore: [300, 900],
  ice: [55, 270],
  silica: [70, 200],
};
const getDensity = (type: MineableCommodity) => random(...densities[type]);

export function spawnAsteroidField(
  commodity: MineableCommodity,
  size: number,
  sector: Sector
) {
  const maxR = (sectorSize / 20) * Math.sqrt(3);

  const sectorCenterPosition = hecsToCartesian(
    sector.cp.hecsPosition.value,
    sectorSize / 10
  );
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

  createAsteroidField(window.sim as Sim, position, sector, {
    asteroidResources: {
      max: resourcesPerAsteroid[commodity][1],
      min: resourcesPerAsteroid[commodity][0],
    },
    density: getDensity(commodity),
    size,
    type: commodity,
  });
}

export function getRandomAsteroidField() {
  const sectors = (window.sim as Sim).queries.sectors.get();
  const mineable =
    mineableCommodities[
      Object.keys(mineableCommodities)[
        Math.floor(Object.keys(mineableCommodities).length * Math.random())
      ]
    ];

  spawnAsteroidField(mineable, getSize(), pickRandom(sectors));
}
