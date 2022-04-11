import { Faction } from "../economy/faction";
import { Field } from "../economy/field";
import { Ship } from "../entities/ship";
import { World } from "../world";
import { BaseSim } from "./BaseSim";

export class Sim extends BaseSim {
  factions: Faction[];
  ships: Ship[];
  fields: Field[];

  constructor() {
    super();
    this.factions = [];
    this.ships = [];
    this.fields = [];
  }

  load = (world: World) => {
    this.factions = world.factions;
    this.fields = world.fields;
  };

  next = (delta: number) => {
    this.factions.forEach((faction) => faction.sim(delta));
    this.ships.forEach((ship) => ship.sim(delta));
  };
}

export const sim = new Sim();
window.sim = sim;
