import { Faction } from "../economy/faction";
import { AsteroidField } from "../economy/field";
import { Entity } from "../components/entity";
import { Ship } from "../entities/ship";
import { World } from "../world";
import { BaseSim } from "./BaseSim";
import { System } from "../systems/system";
import { BudgetPlanningSystem } from "../systems/budgetPlanning";
import { ProducingSystem } from "../systems/producing";
import { StorageQuotaPlanningSystem } from "../systems/storageQuotaPlanning";
import { TradingSystem } from "../systems/trading";
import { SelectingSystem } from "../systems/selecting";
import { SelectionManager } from "../components/selection";

export class Sim extends BaseSim {
  entities: Entity[] = [];
  factions: Faction[] = [];
  ships: Ship[] = [];
  fields: AsteroidField[] = [];

  entityIdCounter: number = 0;

  systems: System[];

  constructor() {
    super();

    const settingsEntity = new Entity(this);
    settingsEntity.cp.selectionManager = new SelectionManager();

    this.systems = [
      new BudgetPlanningSystem(this),
      new ProducingSystem(this),
      new StorageQuotaPlanningSystem(this),
      new TradingSystem(this),
      new SelectingSystem(this),
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
    this.ships.forEach((ship) => ship.simulate(delta));

    this.systems.forEach((s) => s.exec(delta));
  };
}

export const sim = new Sim();
window.sim = sim;
