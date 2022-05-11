import { Faction } from "../economy/faction";
import { getRandomAsteroidField } from "./asteroids";
import { factions } from "./factions";

export interface World {
  factions: Faction[];
}

Array(15).fill(0).map(getRandomAsteroidField);

const world: World = {
  factions,
};

export default world;
