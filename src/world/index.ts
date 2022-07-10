import { minBy } from "lodash";
import { Matrix, matrix, randomInt } from "mathjs";
import { createSector, Sector } from "../archetypes/sector";
import { hecsDistance, hecsMove, transforms } from "../components/hecsPosition";
import { Sim } from "../sim";
import { pickRandom } from "../utils/generators";
import { getRandomAsteroidField } from "./asteroids";
import { createFactions } from "./factions";
import { getSectorName } from "./sectorNames";
import { createLink } from "./teleporters";

function getRandomWorld(
  sim: Sim,
  numberOfIslands: number,
  numberOfFactions: number
): Promise<void> {
  const size = 2 ** Math.ceil(numberOfIslands / 2);

  return new Promise((resolve) => {
    setTimeout(() => {
      const islands: Sector[][] = [
        [
          createSector(sim, {
            position: matrix([0, 0, 0]),
            name: "Sector Alpha",
          }),
        ],
      ];

      for (let i = 1; i <= numberOfIslands; i++) {
        islands.push([]);
        const islandName = getSectorName();
        const numSectorsInIsland = randomInt(1, 6);

        let position: Matrix | null = null;
        for (let s = 0; s < numSectorsInIsland; s++) {
          let breakCounter = 0;
          let hasBroke = false;
          let prevSector: Sector | null = null;

          if (s === 0) {
            do {
              if (breakCounter > 100000) throw new Error("Couldn't make map");
              breakCounter++;

              const q = randomInt(-size, size);
              const r = randomInt(-size, size);
              position = matrix([q, r, -q - r]);
            } while (
              !islands
                .slice(0, i)
                .some((island) =>
                  island.some(
                    (sector) =>
                      hecsDistance(sector.cp.hecsPosition.value, position!) ===
                      2
                  )
                ) ||
              !islands
                .slice(0, i)
                .every((island) =>
                  island.every(
                    (sector) =>
                      hecsDistance(sector.cp.hecsPosition.value, position!) > 1
                  )
                )
            );
          } else {
            prevSector = pickRandom(islands[i]);

            do {
              if (breakCounter > 1000) {
                hasBroke = true;
                break;
              }
              breakCounter++;

              position = hecsMove(
                prevSector.cp.hecsPosition.value,
                pickRandom(
                  Object.keys(transforms) as Array<keyof typeof transforms>
                )
              );
            } while (
              islands[i].some(
                (sector) =>
                  hecsDistance(sector.cp.hecsPosition.value, position!) < 1
              ) ||
              islands
                .slice(0, i)
                .flat()
                .some(
                  (sector) =>
                    hecsDistance(sector.cp.hecsPosition.value, position!) < 2
                )
            );
          }

          if (!hasBroke && position) {
            islands[i].push(
              createSector(sim, {
                position,
                name: `${islandName}-${s + 1}`,
              })
            );

            if (s > 0) {
              createLink(sim, [prevSector!, islands[i][s]]);
            }
          }
        }
      }

      const connections: Record<number, number[]> = {};
      islands.forEach((island, islandIndex) => {
        do {
          const pairs = island
            .map((sectorOnIsland) =>
              islands
                .filter((_, i) => i !== islandIndex)
                .map((is) =>
                  is
                    .filter(
                      (sector) =>
                        !(
                          connections[sectorOnIsland.id]?.includes(sector.id) ||
                          connections[sector.id]?.includes(sectorOnIsland.id)
                        )
                    )
                    .map((sector) => [sectorOnIsland, sector])
                )
            )
            .flat(2);

          const pair = minBy(pairs, ([a, b]) =>
            hecsDistance(a.cp.hecsPosition.value, b.cp.hecsPosition.value)
          )!;

          if (!pair) break;

          createLink(sim, pair);
          if (!connections[pair[0].id]) {
            connections[pair[0].id] = [];
          }
          connections[pair[0].id].push(pair[1].id);
        } while (Math.random() > 0.85);
      });

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
