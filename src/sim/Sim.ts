import { Faction } from "../economy/faction";
import { AsteroidField } from "../economy/field";
import { Entity } from "../components/entity";
import { Ship } from "../entities/ship";
import { World } from "../world";
import { BaseSim } from "./BaseSim";
import { Facility } from "../economy/factility";
import { System } from "../systems/system";
import { BudgetPlanningSystem } from "../systems/budgetPlanning";
import {
  ProducingByModulesSystem,
  ProducingSystem,
} from "../systems/producing";
import { StorageQuotaPlanningSystem } from "../systems/storageQuotaPlanning";

export class Sim extends BaseSim {
  entities: Entity[] = [];
  factions: Faction[] = [];
  facilities: Facility[] = [];
  ships: Ship[] = [];
  fields: AsteroidField[] = [];

  entityIdCounter: number = 0;

  systems: System[];

  constructor() {
    super();

    this.systems = [
      new BudgetPlanningSystem(this),
      new ProducingSystem(this),
      new ProducingByModulesSystem(this),
      new StorageQuotaPlanningSystem(this),
    ];
  }

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
    this.facilities.forEach((facility) => facility.simulate(delta));
    this.ships.forEach((ship) => ship.simulate(delta));

    this.systems.forEach((s) => s.exec(delta));
  };
}

export const sim = new Sim();
window.sim = sim;
