import pick from "lodash/pick";
import { Exclude, Expose, Type, plainToInstance } from "class-transformer";
import EventEmitter from "eventemitter3";
// @ts-expect-error
import { reviver, replacer, matrix } from "mathjs";
import { Path } from "graphlib";
import { Faction } from "../economy/faction";
import { Entity } from "../components/entity";
import { BaseSim } from "./BaseSim";
import { System } from "../systems/system";
import { BudgetPlanningSystem } from "../systems/budgetPlanning";
import { ProducingSystem } from "../systems/producing";
import { StorageQuotaPlanningSystem } from "../systems/storageQuotaPlanning";
import { TradingSystem } from "../systems/trading";
import { SelectingSystem } from "../systems/selecting";
import { OrderPlanningSystem } from "../systems/orderPlanning";
import { MovingSystem } from "../systems/moving";
import { MiningSystem } from "../systems/mining";
import { createQueries, Queries } from "../systems/query";
import { OrderExecutingSystem } from "../systems/orderExecuting/orderExecuting";
import { PathPlanningSystem } from "../systems/pathPlanning";
import { CooldownUpdatingSystem } from "../systems/cooldowns";
import { MissingEntityError } from "../errors";

@Exclude()
export class Sim extends BaseSim {
  @Expose()
  entityIdCounter: number = 0;
  events: EventEmitter<
    "add-component" | "remove-component" | "remove-entity",
    Entity
  >;

  @Expose()
  @Type(() => Faction)
  factions: Faction[] = [];
  @Expose()
  @Type(() => Entity)
  entities: Map<number, Entity>;
  systems: System[];
  queries: Queries;
  paths: Record<string, Record<string, Path>>;

  constructor() {
    super();

    this.entities = new Map();
    this.events = new EventEmitter();

    const settingsEntity = new Entity(this);
    settingsEntity.addComponent({
      id: null,
      focused: false,
      name: "selectionManager",
    });

    this.queries = createQueries(this);

    this.systems = [
      new PathPlanningSystem(this),
      new CooldownUpdatingSystem(this),
      new ProducingSystem(this),
      new StorageQuotaPlanningSystem(this),
      new TradingSystem(this),
      new BudgetPlanningSystem(this),
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
    this.entities.set(entity.id, entity);
    this.entityIdCounter += 1;
  };

  unregisterEntity = (entity: Entity) => {
    this.entities.delete(entity.id);
    this.events.emit("remove-entity", entity);
  };

  next = (delta: number) => {
    this.systems.forEach((s) => s.exec(delta));
  };

  // eslint-disable-next-line no-unused-vars
  find = (cb: (entity: Entity) => boolean): Entity | undefined => {
    for (const [, entity] of this.entities) {
      if (cb(entity)) return entity;
    }

    return undefined;
  };

  get = (id: number): Entity => {
    const entity = this.entities.get(id);

    if (!entity) {
      throw new MissingEntityError(id);
    }

    return entity;
  };

  save = () => {
    const save = JSON.stringify(this, replacer);

    localStorage.setItem("save", save);
  };

  static load() {
    const save = JSON.parse(localStorage.getItem("save")!, reviver);
    const sim = plainToInstance(Sim, save);

    sim.entities.forEach((entity) => {
      entity.sim = sim;

      if (entity.cp.owner?.value) {
        entity.cp.owner.value = sim.factions.find(
          (f) => f.slug === entity.cp.owner!.value!.slug
        )!;
      }

      if (entity.cp.position) {
        entity.cp.position.coord = matrix(
          // eslint-disable-next-line no-underscore-dangle
          (entity.cp.position.coord as any)._data
        );
      }
      if (entity.cp.hecsPosition) {
        entity.cp.hecsPosition.value = matrix(
          // eslint-disable-next-line no-underscore-dangle
          (entity.cp.hecsPosition.value as any)._data
        );
      }
    });

    return sim;
  }

  toJSON() {
    return pick(this, ["entityIdCounter", "entities", "factions"]);
  }
}
