import { Faction } from "../economy/faction";
import { AsteroidField } from "../economy/field";
import { Entity } from "../components/entity";
import { Ship } from "../entities/ship";
import { World } from "../world";
import { BaseSim } from "./BaseSim";

export class Sim extends BaseSim {
  entities: Entity[] = [];
  factions: Faction[] = [];
  ships: Ship[] = [];
  fields: AsteroidField[] = [];

  entityIdCounter: number = 0;

  registerEntity = (entity: Entity) => {
    entity.id = this.entityIdCounter;
    this.entities.push(entity);
    this.entityIdCounter += 1;
  };

  load = (world: World) => {
    this.factions = world.factions;
    this.fields = world.fields;
  };

  next = (delta: number) => {
    this.factions.forEach((faction) => faction.sim(delta));
    this.ships.forEach((ship) => ship.simulate(delta));
  };
}

export const sim = new Sim();
window.sim = sim;
