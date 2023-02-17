import minBy from "lodash/minBy";
import type { Sector } from "../archetypes/sector";
import { hecsDistance } from "../components/hecsPosition";
import type { Sim } from "../sim";
import { createLink } from "./teleporters";

export function createConnections(sim: Sim, islands: Sector[][]): void {
  const connections: Record<number, number[]> = {};

  islands.forEach((islandA, islandAIndex) => {
    for (let i = 0; i < islands.length; i++) {
      const pairs = islandA
        .map((sectorOnIsland) =>
          islands.map((islandB, islandBIndex) =>
            islandBIndex === islandAIndex ||
            connections[islandAIndex]?.includes(islandBIndex) ||
            connections[islandBIndex]?.includes(islandAIndex)
              ? []
              : islandB.map((sector) => [
                  { sector: sectorOnIsland, island: islandAIndex },
                  { sector, island: islandBIndex },
                ])
          )
        )
        .flat(2);

      const pair = minBy(pairs, ([a, b]) =>
        hecsDistance(
          a.sector.cp.hecsPosition.value,
          b.sector.cp.hecsPosition.value
        )
      )!;

      if (
        !pair ||
        hecsDistance(
          pair[0].sector.cp.hecsPosition.value,
          pair[1].sector.cp.hecsPosition.value
        ) > 2
      )
        break;

      createLink(
        sim,
        pair.map(({ sector }) => sector)
      );
      if (!connections[pair[0].island]) {
        connections[pair[0].island] = [];
      }
      connections[pair[0].island].push(pair[1].island);
    }
  });
}
