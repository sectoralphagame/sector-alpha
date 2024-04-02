import { random } from "mathjs";
import type { Position2D } from "@core/components/position";
import type { MineableCommodity } from "../economy/commodity";
import { createAsteroidField } from "../archetypes/asteroidField";
import type { Sim } from "../sim";
import type { Sector } from "../archetypes/sector";
import { sectorSize } from "../archetypes/sector";

const densities: Record<MineableCommodity, [number, number]> = {
  fuelium: [100, 600],
  goldOre: [250, 550],
  ore: [250, 780],
  ice: [80, 300],
  silica: [120, 300],
};
const resourcesPerAsteroid: Record<MineableCommodity, [number, number]> = {
  fuelium: [200, 400],
  goldOre: [50, 110],
  ore: [300, 900],
  ice: [55, 270],
  silica: [70, 200],
};
const getDensity = (type: MineableCommodity) => random(...densities[type]) * 10;

export function spawnAsteroidField(
  sim: Sim,
  commodity: MineableCommodity,
  size: number,
  sector: Sector
) {
  const maxR = (sectorSize / 20) * Math.sqrt(3);

  const polarPosition = {
    r: random(0, maxR - size - 0.5),
    a: random(-Math.PI, Math.PI),
  };
  const position: Position2D = [
    polarPosition.r * Math.cos(polarPosition.a),
    polarPosition.r * Math.sin(polarPosition.a),
  ];

  createAsteroidField(sim, position, sector, {
    asteroidResources: {
      max: resourcesPerAsteroid[commodity][1],
      min: resourcesPerAsteroid[commodity][0],
    },
    density: getDensity(commodity),
    size,
    type: commodity,
  });
}
