import "reflect-metadata";
import pick from "lodash/pick";
import { Exclude, Expose, Type, plainToInstance } from "class-transformer";
// For some reason replacer is not exported in types
// @ts-expect-error
import { reviver, replacer } from "mathjs";
import type { Path } from "graphlib";
import { SyncHook } from "tapable";

import isPlainObject from "lodash/isPlainObject";
import { filter, map, pipe, toArray } from "@fxts/core";
import { NavigatingSystem } from "@core/systems/navigating";
import { OutOfBoundsCheckingSystem } from "@core/systems/reporting/outOfBoundsChecking";
import { FacilityBuildingSystem } from "@core/systems/facilityBuilding";
import { UndeployingSystem } from "@core/systems/undeploying";
import { isHeadless } from "@core/settings";
import type { CoreComponents } from "@core/components/component";
import type { EntityTag } from "@core/tags";
import { DeadUnregisteringSystem } from "@core/systems/deadUnregistering";
import { AttackingSystem } from "@core/systems/attacking";
import { SpottingSystem } from "@core/systems/ai/spotting";
import { HitpointsRegeneratingSystem } from "@core/systems/hitpointsRegenerating";
import { MilitaryModuleSpottingSystem } from "@core/systems/ai/militaryModuleSpotting";
import { DisposableUnregisteringSystem } from "@core/systems/disposableUnregistering";
import { TauHarassingSystem } from "@core/systems/ai/tauHarassing";
import { ShipReturningSystem } from "@core/systems/ai/shipReturning";
import { Entity, EntityComponents } from "../entity";
import { BaseSim } from "./BaseSim";
import type { System } from "../systems/system";
import { BudgetPlanningSystem } from "../systems/budgetPlanning";
import { ProducingSystem } from "../systems/producing";
import { StorageQuotaPlanningSystem } from "../systems/storageQuotaPlanning";
import { TradingSystem } from "../systems/trading";
import { SelectingSystem } from "../systems/selecting";
import { OrderPlanningSystem } from "../systems/ai/orderPlanning";
import { MovingSystem } from "../systems/moving";
import { MiningSystem } from "../systems/mining";
import type { Queries } from "../systems/utils/query";
import { createQueries } from "../systems/utils/query";
import { OrderExecutingSystem } from "../systems/orderExecuting/orderExecuting";
import { PathPlanningSystem } from "../systems/pathPlanning";
import { CooldownUpdatingSystem } from "../systems/cooldowns";
import { MissingEntityError } from "../errors";
import { openDb } from "../db";
import { AsteroidSpawningSystem } from "../systems/asteroidSpawning";
import { FacilityPlanningSystem } from "../systems/ai/facilityPlanning";
import { SectorStatisticGatheringSystem } from "../systems/sectorStatisticGathering";
import { ShipPlanningSystem } from "../systems/ai/shipPlanning";
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
  hooks: {
    addComponent: SyncHook<{ entity: Entity; component: keyof CoreComponents }>;
    removeComponent: SyncHook<{
      entity: Entity;
      component: keyof CoreComponents;
    }>;
    addTag: SyncHook<{ entity: Entity; tag: EntityTag }>;
    removeTag: SyncHook<{ entity: Entity; tag: EntityTag }>;
    removeEntity: SyncHook<Entity>;
    destroy: SyncHook<void>;
  };

  @Expose()
  @Type(() => Entity)
  entities: Map<number, Entity>;
  systems: System[];
  queries: Queries;
  paths: Record<string, Record<string, Path>>;
  queues: Queues = { systemsToAdd: [], systemsToRemove: [] };
  diagnostics = false;

  constructor() {
    super();

    this.entities = new Map();
    this.hooks = {
      addComponent: new SyncHook(["addComponent"]),
      removeComponent: new SyncHook(["removeComponent"]),
      addTag: new SyncHook(["addTag"]),
      removeTag: new SyncHook(["removeTag"]),
      removeEntity: new SyncHook(["removeEntity"]),
      destroy: new SyncHook(["destroy"]),
    };

    this.queries = createQueries(this);

    this.systems = [
      PathPlanningSystem,
      CooldownUpdatingSystem,
      ProducingSystem,
      StorageQuotaPlanningSystem,
      TradingSystem,
      BudgetPlanningSystem,
      SelectingSystem,
      OrderPlanningSystem,
      NavigatingSystem,
      MovingSystem,
      MiningSystem,
      OrderExecutingSystem,
      AsteroidSpawningSystem,
      FacilityPlanningSystem,
      ShipPlanningSystem,
      SectorStatisticGatheringSystem,
      InflationStatisticGatheringSystem,
      ShipBuildingSystem,
      FacilityBuildingSystem,
      UndeployingSystem,
      AttackingSystem,
      SpottingSystem,
      MilitaryModuleSpottingSystem,
      HitpointsRegeneratingSystem,
      TauHarassingSystem,
      ShipReturningSystem,
      DisposableUnregisteringSystem,
      DeadUnregisteringSystem,
    ].map((S) => new S(this));

    if (!isHeadless) {
      window.cheats = {};
    }
  }

  registerEntity = (entity: Entity) => {
    entity.id = this.entityIdCounter;
    this.entities.set(entity.id, entity);
    this.entityIdCounter += 1;
  };

  unregisterEntity = (entity: Entity) => {
    this.entities.delete(entity.id);
    this.hooks.removeEntity.call(entity);
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
    this.hooks.destroy.call();
    if (!isHeadless) {
      window.selected = undefined!;
    }
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

  toggleDiagnostics = () => {
    const diagnosticsSystems = [OutOfBoundsCheckingSystem];
    if (this.diagnostics) {
      this.diagnostics = false;
      this.systems = this.systems.filter((system) =>
        diagnosticsSystems.every((DS) => !(system instanceof DS))
      );
    } else {
      this.diagnostics = true;
      this.systems.push(...diagnosticsSystems.map((DS) => new DS(this)));
    }
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
      entity.tags = new Set(entity.tags);
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
