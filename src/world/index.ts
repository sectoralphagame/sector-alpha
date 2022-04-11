import { Faction } from "../economy/faction";
import { Field, getRandomField } from "../economy/field";
import { factions } from "./factions";

export interface World {
  factions: Faction[];
  fields: Field[];
}

const world: World = {
  factions,
  fields: Array(10)
    .fill(0)
    .map(getRandomField),
};

export default world;
