import { Faction } from "../economy/faction";
import { AsteroidField, getRandomAsteroidField } from "../economy/field";
import { factions } from "./factions";

export interface World {
  factions: Faction[];
  fields: AsteroidField[];
}

const world: World = {
  factions,
  fields: Array(10)
    .fill(0)
    .map(getRandomAsteroidField),
};

export default world;
