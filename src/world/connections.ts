import minBy from "lodash/minBy";
import { Sector } from "../archetypes/sector";
import { hecsDistance } from "../components/hecsPosition";
import { Sim } from "../sim";
import { createLink } from "./teleporters";

export function createConnections(sim: Sim, islands: Sector[][]): void {
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

      if (
        !pair ||
        hecsDistance(
          pair[0].cp.hecsPosition.value,
          pair[1].cp.hecsPosition.value
        ) > 2
      )
        break;

      createLink(sim, pair);
      if (!connections[pair[0].id]) {
        connections[pair[0].id] = [];
      }
      connections[pair[0].id].push(pair[1].id);
    } while (Math.random() > 0.85);
  });
}
