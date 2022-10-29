import "reflect-metadata";
import pick from "lodash/pick";
import { Exclude, Expose, Type, plainToInstance } from "class-transformer";
import EventEmitter from "eventemitter3";
// For some reason replacer is not exported in types
// @ts-expect-error
import { reviver, replacer } from "mathjs";
import { Path } from "graphlib";

import isPlainObject from "lodash/isPlainObject";
import { filter, map, pipe, toArray } from "@fxts/core";
import { NavigatingSystem } from "@core/systems/navigating";
import { OutOfBoundsCheckingSystem } from "@core/systems/reporting/outOfBoundsChecking";
import { Entity, EntityComponents } from "../components/entity";
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
import { openDb } from "../db";
import { AsteroidSpawningSystem } from "../systems/asteroidSpawning";
import { FacilityPlanningSystem } from "../systems/facilityPlanning";
import { SectorStatisticGatheringSystem } from "../systems/sectorStatisticGathering";
import { ShipPlanningSystem } from "../systems/shipPlanning";
import { InflationStatisticGatheringSystem } from "../systems/inflationStatisticGathering";
import { ShipBuildingSystem } from "../systems/shipBuilding";

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

interface Queues {
  systemsToAdd: System[];
  systemsToRemove: System[];
}

@Exclude()
export class Sim extends BaseSim {
  @Expose()
  entityIdCounter: number = 0;
  events: EventEmitter<
    "add-component" | "remove-component" | "remove-entity" | "destroy",
    Entity
  >;

  @Expose()
  @Type(() => Entity)
  entities: Map<number, Entity>;
  systems: System[];
  queries: Queries;
  paths: Record<string, Record<string, Path>>;
  queues: Queues = { systemsToAdd: [], systemsToRemove: [] };

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
      new NavigatingSystem(this),
      new MovingSystem(this),
      new MiningSystem(this),
      new OrderExecutingSystem(this),
      new AsteroidSpawningSystem(this),
      new FacilityPlanningSystem(this),
      new ShipPlanningSystem(this),
      new SectorStatisticGatheringSystem(this),
      new InflationStatisticGatheringSystem(this),
      new ShipBuildingSystem(this),
      new OutOfBoundsCheckingSystem(this),
    ];
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

  registerSystem = (system: System) => {
    this.queues.systemsToAdd.push(system);
  };

  unregisterSystem = (system: System) => {
    this.queues.systemsToRemove.push(system);
  };

  next = (delta: number) => {
    this.systems.forEach((s) => s.exec(delta));
    if (this.queues.systemsToRemove.length > 0) {
      this.systems = this.systems.filter(
        (system) => !this.queues.systemsToRemove.includes(system)
      );
      this.queues.systemsToRemove.forEach((system) => system.destroy());
      this.queues.systemsToRemove = [];
    }
    if (this.queues.systemsToAdd.length > 0) {
      this.systems.push(...this.queues.systemsToAdd);
      this.queues.systemsToAdd = [];
    }
    this.updateTimer(delta);
  };

  init = () => {
    const settingsEntity = new Entity(this);
    settingsEntity
      .addComponent({
        id: null,
        secondaryId: null,
        focused: false,
        name: "selectionManager",
      })
      .addComponent({
        name: "systemManager",
        lastStatUpdate: 0,
        lastInflationStatUpdate: 0,
      })
      .addComponent({
        name: "inflationStats",
        basketPrices: [],
      });
  };

  // eslint-disable-next-line no-unused-vars
  find = (cb: (entity: Entity) => boolean): Entity | undefined => {
    for (const [, entity] of this.entities) {
      if (cb(entity)) return entity;
    }

    return undefined;
  };

  // eslint-disable-next-line no-unused-vars
  filter = (cb: (entity: Entity) => boolean): Entity[] =>
    pipe(
      this.entities,
      filter(([, entity]) => cb(entity)),
      map(([, e]) => e),
      toArray
    );

  /**
   * Get entity or `undefined`, depending on entity's existence
   * @param id Entity ID
   */
  get = <T extends Entity = Entity>(id: number): T | undefined =>
    this.entities.get(id) as T;

  /**
   * Use it when it should not be possible in any situation to get not existing
   * entity
   * @param id Entity ID
   */
  getOrThrow = <T extends Entity = Entity>(id: number): T => {
    const entity = this.entities.get(id);

    if (!entity) {
      throw new MissingEntityError(id);
    }

    return entity as T;
  };

  destroy = () => {
    this.stop();
    this.systems.forEach((system) => system.destroy());
    this.events.emit("destroy");
    window.selected = undefined!;
    window.sim = undefined!;
  };

  serialize = () => JSON.stringify(this, replacer);

  save = async (name: string, id?: number) => {
    const data = this.serialize();
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

  static async deleteSave(id: number) {
    const db = await openDb();

    const tx = db.transaction("saves", "readwrite");
    const os = tx.objectStore("saves");

    os.delete(id);

    tx.commit();

    return tx.done;
  }

  static load(data: string) {
    const save = JSON.parse(data);
    const sim = plainToInstance(Sim, save);
    Object.values(sim.queries).forEach((query) => query.reset());
    const entityMap = new Map();

    sim.entities.forEach((entity) => {
      entityMap.set(entity.id, entity);
      entity.sim = sim;

      entity.components = reviveMathjs(entity.components);
      entity.components = Object.assign(
        new EntityComponents(),
        entity.components
      );
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
      ...pick(this, ["entityIdCounter", "timeOffset"]),
      entities: [...this.entities].map(([, e]) => e),
    };
  }
}
