import { matrix } from "mathjs";
import { createSector, sector } from "../archetypes/sector";
import { hecsMove } from "../components/hecsPosition";
import { sim, Sim } from "../sim";
import { getRandomAsteroidField } from "./asteroids";
import { factions } from "./factions";
import { getSectorName } from "./sectorNames";

export interface World {
  // eslint-disable-next-line no-unused-vars, no-shadow
  factions: (sim: Sim) => void;
}

const alpha = createSector(window.sim as Sim, {
  position: matrix([0, 0, 0]),
  name: "Sector Alpha",
});
createSector(window.sim as Sim, {
  position: hecsMove(alpha.cp.hecsPosition.value, "e"),
  name: getSectorName(),
});
createSector(window.sim as Sim, {
  position: hecsMove(alpha.cp.hecsPosition.value, "ne"),
  name: getSectorName(),
});
createSector(window.sim as Sim, {
  position: hecsMove(alpha.cp.hecsPosition.value, "nw"),
  name: getSectorName(),
});
createSector(window.sim as Sim, {
  position: hecsMove(alpha.cp.hecsPosition.value, "w"),
  name: getSectorName(),
});
createSector(window.sim as Sim, {
  position: hecsMove(alpha.cp.hecsPosition.value, "sw"),
  name: getSectorName(),
});
createSector(window.sim as Sim, {
  position: hecsMove(alpha.cp.hecsPosition.value, "se"),
  name: getSectorName(),
});
createSector(window.sim as Sim, {
  position: hecsMove(
    sector(sim.queries.sectors.get()[6]).cp.hecsPosition.value,
    "e"
  ),
  name: getSectorName(),
});

Array(25).fill(0).map(getRandomAsteroidField);

const world: World = {
  factions,
};

export default world;
