import { matrix } from "mathjs";
import { createSector, sector, sectorComponents } from "../archetypes/sector";
import { hecsMove } from "../components/hecsPosition";
import { sim, Sim } from "../sim";
import { getRandomAsteroidField } from "./asteroids";
import { factions } from "./factions";

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
  name: "1",
});
createSector(window.sim as Sim, {
  position: hecsMove(alpha.cp.hecsPosition.value, "ne"),
  name: "2",
});
createSector(window.sim as Sim, {
  position: hecsMove(alpha.cp.hecsPosition.value, "nw"),
  name: "3",
});
createSector(window.sim as Sim, {
  position: hecsMove(alpha.cp.hecsPosition.value, "w"),
  name: "4",
});
createSector(window.sim as Sim, {
  position: hecsMove(alpha.cp.hecsPosition.value, "sw"),
  name: "5",
});
createSector(window.sim as Sim, {
  position: hecsMove(alpha.cp.hecsPosition.value, "se"),
  name: "6",
});
createSector(window.sim as Sim, {
  position: hecsMove(
    sector(
      sim.entities.find(
        (s) => s.hasComponents(sectorComponents) && s.cp.name!.value === "6"
      )!
    ).cp.hecsPosition.value,
    "e"
  ),
  name: "7",
});

Array(20).fill(0).map(getRandomAsteroidField);

const world: World = {
  factions,
};

export default world;
