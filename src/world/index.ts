import { Sim } from "../sim";
import { getRandomAsteroidField } from "./asteroids";
import { createConnections } from "./connections";
import { createFactions } from "./factions";
import { createIslands } from "./islands";

function getRandomWorld(
  sim: Sim,
  numberOfIslands: number,
  numberOfFactions: number
): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const islands = createIslands(sim, numberOfIslands);
      createConnections(sim, islands);

      const sectors = sim.queries.sectors.get();
      Array(sectors.length * 4)
        .fill(0)
        .map(getRandomAsteroidField);

      createFactions(sim, islands.slice(1), numberOfFactions);
      resolve();
    }, 0);
  });
}

export default getRandomWorld;
