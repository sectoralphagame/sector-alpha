import { matrix } from "mathjs";
import { createSector } from "../archetypes/sector";
import { Sim } from "../sim";
import { getRandomAsteroidField } from "./asteroids";
import { factions } from "./factions";
import { getSectorName } from "./sectorNames";

function getRandomWorld(sim: Sim): void {
  createSector(sim, {
    position: matrix([0, 0, 0]),
    name: "Sector Alpha",
  });
  createSector(sim, {
    position: matrix([2, 0, -2]),
    name: getSectorName(),
  });
  createSector(sim, {
    position: matrix([2, -1, -1]),
    name: getSectorName(),
  });
  createSector(sim, {
    position: matrix([2, -3, 1]),
    name: getSectorName(),
  });
  createSector(sim, {
    position: matrix([1, -2, 1]),
    name: getSectorName(),
  });
  createSector(sim, {
    position: matrix([-2, 1, 1]),
    name: getSectorName(),
  });
  createSector(sim, {
    position: matrix([-2, 2, 0]),
    name: getSectorName(),
  });
  createSector(sim, {
    position: matrix([-1, 2, -1]),
    name: getSectorName(),
  });
  createSector(sim, {
    position: matrix([0, 2, -2]),
    name: getSectorName(),
  });

  Array(45).fill(0).map(getRandomAsteroidField);

  factions(sim);
}

export default getRandomWorld;
