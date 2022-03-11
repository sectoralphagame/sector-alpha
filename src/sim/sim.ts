import { Faction } from "../economy/faction";
import { World } from "../world";
import { BaseSim } from "./BaseSim";

export class Sim extends BaseSim {
  factions: Faction[];

  constructor() {
    super();
    this.factions = [];
  }

  load = (world: World) => {
    this.factions = world.factions;
  };

  next = (delta: number) => {
    this.factions.forEach((faction) => faction.sim(delta));
  };
}

export const sim = new Sim();
window.sim = sim;
