import { matrix, random } from "mathjs";
import { createFaction } from "../archetypes/faction";
import { createShip } from "../archetypes/ship";
import { changeBudgetMoney } from "../components/budget";
import { MineableCommodity } from "../economy/commodity";
import { Sim } from "../sim";
import { pickRandom } from "../utils/generators";
import { getRandomAsteroidField, spawnAsteroidField } from "./asteroids";
import { createConnections } from "./connections";
import { createFactions } from "./factions";
import { createIslands } from "./islands";
import { shipClasses } from "./ships";

function getRandomWorld(
  sim: Sim,
  numberOfIslands: number,
  numberOfFactions: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    requestIdleCallback(() => {
      const islands = createIslands(sim, numberOfIslands);
      createConnections(sim, islands);

      const sectors = sim.queries.sectors.get();
      for (let i = 0; i < sectors.length * 2; i++) {
        getRandomAsteroidField(sim);
      }

      const player = createFaction("Player", sim);
      player.addComponent({ name: "player" });
      changeBudgetMoney(player.cp.budget, 5000);
      const sectorAlpha = sim.queries.sectors.get()[0]!;

      const playerShip = createShip(sim, {
        ...pickRandom(
          shipClasses.filter(
            ({ role, size }) => role === "transport" && size === "small"
          )
        ),
        position: matrix([0, 0]),
        owner: player,
        sector: sectorAlpha,
      });
      playerShip.cp.autoOrder!.default = "hold";

      try {
        createFactions(sim, islands.slice(1), numberOfFactions);
      } catch {
        reject();
      }
      sim.queries.ai
        .get()
        .filter((faction) => faction.cp.ai.type === "territorial")
        .forEach((faction) =>
          ["ice", "fuelium"].forEach((commodity: MineableCommodity) => {
            const ownedSectors = sectors.filter(
              (sector) => sector.cp.owner?.id === faction.id
            );

            spawnAsteroidField(
              sim,
              commodity,
              random(
                7 + Math.sqrt(ownedSectors.length),
                9 + Math.sqrt(ownedSectors.length)
              ),
              pickRandom(ownedSectors)
            );
          })
        );

      resolve();
    });
  });
}

export default getRandomWorld;
