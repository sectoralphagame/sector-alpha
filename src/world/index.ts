import { Faction } from "../economy/faction";
import { factions } from "./factions";

export interface World {
  factions: Faction[];
}

const world: World = {
  factions,
};

export default world;
