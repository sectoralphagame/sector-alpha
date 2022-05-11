import EventEmitter from "eventemitter3";
import { Faction } from "../economy/faction";
import { Entity } from "../components/entity";
import { World } from "../world";
import { BaseSim } from "./BaseSim";
import { System } from "../systems/system";
import { BudgetPlanningSystem } from "../systems/budgetPlanning";
import { ProducingSystem } from "../systems/producing";
import { StorageQuotaPlanningSystem } from "../systems/storageQuotaPlanning";
import { TradingSystem } from "../systems/trading";
import { SelectingSystem } from "../systems/selecting";
import { SelectionManager } from "../components/selection";
import { OrderPlanningSystem } from "../systems/orderPlanning";
import { MovingSystem } from "../systems/moving";
import { MiningSystem } from "../systems/mining";
import { createQueries, Queries } from "../systems/query";
import { OrderExecutingSystem } from "../systems/orderExecuting/orderExecuting";

export class Sim extends BaseSim {
  entityIdCounter: number = 0;
  events: EventEmitter<"add-component" | "remove-component", Entity>;

  factions: Faction[] = [];
  entities: Entity[] = [];
  systems: System[];
  queries: Queries;

  constructor() {
    super();

    this.events = new EventEmitter();

    const settingsEntity = new Entity(this);
    settingsEntity.cp.selectionManager = new SelectionManager();

    this.queries = createQueries(this);

    this.systems = [
      new BudgetPlanningSystem(this),
      new ProducingSystem(this),
      new StorageQuotaPlanningSystem(this),
      new TradingSystem(this),
      new SelectingSystem(this),
      new OrderPlanningSystem(this),
      new MovingSystem(this),
      new MiningSystem(this),
      new OrderExecutingSystem(this),
    ];

    if (process.env.NODE_ENV !== "test") {
      // Do not try to render anything while testing
      // eslint-disable-next-line global-require
      const { RenderingSystem } = require("../systems/rendering");
      this.systems.push(new RenderingSystem(this));
    }
  }

  registerEntity = (entity: Entity) => {
    entity.id = this.entityIdCounter;
    this.entities.push(entity);
    this.entityIdCounter += 1;
  };

  load = (world: World) => {
    this.factions = world.factions;
  };

  next = (delta: number) => {
    this.systems.forEach((s) => s.exec(delta));
  };
}

export const sim = new Sim();
window.sim = sim;
