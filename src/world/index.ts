import { matrix } from "mathjs";
import { createSector } from "../archetypes/sector";
import { Sim } from "../sim";
import { getRandomAsteroidField } from "./asteroids";
import { factions } from "./factions";

export interface World {
  // eslint-disable-next-line no-unused-vars
  factions: (sim: Sim) => void;
}

const alpha = createSector(window.sim as Sim, {
  position: matrix([0, 0, 0]),
  name: "Sector Alpha",
});
createSector(window.sim as Sim, {
  position: alpha.cp.hecsPosition.e(),
  name: "1",
});
createSector(window.sim as Sim, {
  position: alpha.cp.hecsPosition.ne(),
  name: "2",
});
createSector(window.sim as Sim, {
  position: alpha.cp.hecsPosition.nw(),
  name: "3",
});
createSector(window.sim as Sim, {
  position: alpha.cp.hecsPosition.w(),
  name: "4",
});
createSector(window.sim as Sim, {
  position: alpha.cp.hecsPosition.sw(),
  name: "5",
});
createSector(window.sim as Sim, {
  position: alpha.cp.hecsPosition.se(),
  name: "6",
});

Array(20).fill(0).map(getRandomAsteroidField);

const world: World = {
  factions,
};

export default world;
