import { matrix } from "mathjs";
import { createSector, sector } from "../archetypes/sector";
import { hecsMove } from "../components/hecsPosition";
import { Sim } from "../sim";
import { getRandomAsteroidField } from "./asteroids";
import { factions } from "./factions";
import { getSectorName } from "./sectorNames";

function getRandomWorld(sim: Sim): void {
  const alpha = createSector(sim, {
    position: matrix([0, 0, 0]),
    name: "Sector Alpha",
  });
  createSector(sim, {
    position: hecsMove(alpha.cp.hecsPosition.value, "se"),
    name: getSectorName(),
  });
  createSector(sim, {
    position: hecsMove(alpha.cp.hecsPosition.value, "ne"),
    name: getSectorName(),
  });
  createSector(sim, {
    position: hecsMove(alpha.cp.hecsPosition.value, "n"),
    name: getSectorName(),
  });
  createSector(sim, {
    position: hecsMove(alpha.cp.hecsPosition.value, "nw"),
    name: getSectorName(),
  });
  createSector(sim, {
    position: hecsMove(alpha.cp.hecsPosition.value, "sw"),
    name: getSectorName(),
  });
  createSector(sim, {
    position: hecsMove(alpha.cp.hecsPosition.value, "s"),
    name: getSectorName(),
  });
  createSector(sim, {
    position: hecsMove(
      sector(sim.queries.sectors.get()[6]).cp.hecsPosition.value,
      "se"
    ),
    name: getSectorName(),
  });

  Array(25).fill(0).map(getRandomAsteroidField);

  factions(sim);
}

export default getRandomWorld;
