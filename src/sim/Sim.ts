import "reflect-metadata";
import pick from "lodash/pick";
import { Exclude, Expose, Type, plainToInstance } from "class-transformer";
import EventEmitter from "eventemitter3";
// For some reason replacer is not exported in types
// @ts-expect-error
import { reviver, replacer } from "mathjs";
import { Path } from "graphlib";
import * as PIXI from "pixi.js";
import isPlainObject from "lodash/isPlainObject";
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
import { setTexture } from "../components/render";
import { openDb } from "../db";
import { AsteroidSpawningSystem } from "../systems/asteroidSpawning";
import { isTest } from "../settings";
import { FacilityPlanningSystem } from "../systems/facilityPlanning";
import { SectorStatisticGatheringSystem } from "../systems/sectorStatisticGathering";
import { ShipPlanningSystem } from "../systems/shipPlanning";

function reviveMathjs(value: any) {
  if (isPlainObject(value)) {
    if (value.mathjs) {
      // According to types, reviver expects no arguments which isn't true
      // @ts-expect-error
      return reviver("", value);
    }

    return Object.keys(value).reduce(
      (acc, key) => ({ ...acc, [key]: reviveMathjs(value[key]) }),
      {}
    );
  }

  return value;
}

@Exclude()
export class Sim extends BaseSim {
  @Expose()
  entityIdCounter: number = 0;
  events: EventEmitter<
    "add-component" | "remove-component" | "remove-entity",
    Entity
  >;

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
      new AsteroidSpawningSystem(this),
      new FacilityPlanningSystem(this),
      new ShipPlanningSystem(this),
      new SectorStatisticGatheringSystem(this),
    ];

    if (!isTest) {
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

  init = () => {
    const settingsEntity = new Entity(this);
    settingsEntity
      .addComponent({
        id: null,
        focused: false,
        name: "selectionManager",
      })
      .addComponent({
        name: "systemManager",
        lastStatUpdate: 0,
      });
  };

  // eslint-disable-next-line no-unused-vars
  find = (cb: (entity: Entity) => boolean): Entity | undefined => {
    for (const [, entity] of this.entities) {
      if (cb(entity)) return entity;
    }

    return undefined;
  };

  /**
   * Get entity or `undefined`, depending on entity's existence
   * @param id Entity ID
   */
  get = (id: number): Entity | undefined => this.entities.get(id);

  /**
   * Use it when it should not be possible in any situation to get not existing
   * entity
   * @param id Entity ID
   */
  getOrThrow = (id: number): Entity => {
    const entity = this.entities.get(id);

    if (!entity) {
      throw new MissingEntityError(id);
    }

    return entity;
  };

  destroy = () => {
    this.systems.forEach((system) => system.destroy());
    this.pause();
    window.selected = undefined!;
  };

  save = async (name: string, id?: number) => {
    const data = JSON.stringify(this, replacer);
    const db = await openDb();

    const tx = db.transaction("saves", "readwrite");
    const os = tx.objectStore("saves");
    if (id) {
      os.put({ id, name, data });
    } else {
      os.add({ name, data });
    }
    tx.commit();

    return tx.done;
  };

  static async load(data: string) {
    const save = JSON.parse(data);
    const sim = plainToInstance(Sim, save);
    Object.values(sim.queries).forEach((query) => query.reset());
    const entityMap = new Map();

    sim.entities.forEach((entity) => {
      entityMap.set(entity.id, entity);
      entity.sim = sim;

      entity.components = reviveMathjs(entity.components);

      if (entity.cp.render) {
        setTexture(entity.cp.render, entity.cp.render.texture);
        entity.cp.render.initialized = false;
      }
      if (entity.cp.renderGraphics) {
        entity.cp.renderGraphics.g = new PIXI.Graphics();
        entity.cp.renderGraphics.initialized = false;
      }
    });

    sim.entities = entityMap;

    return sim;
  }

  static async listSaves() {
    const db = await openDb();

    const tx = db.transaction("saves", "readonly");
    const os = tx.objectStore("saves");
    const results = os.getAll();
    await tx.done;

    return results;
  }

  toJSON() {
    return {
      ...pick(this, ["entityIdCounter", "factions", "timeOffset"]),
      entities: [...this.entities].map(([, e]) => e),
    };
  }
}
