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
import { isHeadless } from "@core/settings";
import type { CoreComponents } from "@core/components/component";
import type { EntityTag } from "@core/tags";
import { Entity, EntityComponents } from "../entity";
import { BaseSim } from "./BaseSim";
import type { System } from "../systems/system";
import type { Queries } from "../systems/utils/query";
import { createQueries } from "../systems/utils/query";
import { MissingEntityError } from "../errors";
import { openDb } from "../db";

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

export interface SimConfig {
  systems: System[];
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

    phase: Record<"init" | "update" | "render" | "cleanup", SyncHook<number>>;
  };

  @Expose()
  @Type(() => Entity)
  entities: Map<number, Entity>;
  queries: Queries;
  paths: Record<string, Record<string, Path>>;
  diagnostics = false;

  constructor({ systems }: SimConfig = { systems: [] }) {
    super();

    this.entities = new Map();
    this.hooks = {
      addComponent: new SyncHook(["addComponent"]),
      removeComponent: new SyncHook(["removeComponent"]),
      addTag: new SyncHook(["addTag"]),
      removeTag: new SyncHook(["removeTag"]),
      removeEntity: new SyncHook(["removeEntity"]),
      destroy: new SyncHook(["destroy"]),
      phase: {
        init: new SyncHook(["init"]),
        update: new SyncHook(["update"]),
        render: new SyncHook(["render"]),
        cleanup: new SyncHook(["cleanup"]),
      },
    };

    this.queries = createQueries(this);

    systems.forEach((system) => system.apply(this));

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
    this.hooks.removeEntity.call(entity);
    this.entities.delete(entity.id);
  };

  next = (delta: number) => {
    this.hooks.phase.init.call(delta);
    this.hooks.phase.update.call(delta);
    this.hooks.phase.render.call(delta);
    this.hooks.phase.cleanup.call(delta);

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
      })
      .addComponent({
        name: "camera",
        zoom: 1,
        position: [0, 0],
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
    this.hooks.destroy.call();
    if (!isHeadless) {
      window.sim = undefined!;
      window.selected = undefined!;
      window.cheats = undefined!;
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

  static async deleteSave(id: number) {
    const db = await openDb();

    const tx = db.transaction("saves", "readwrite");
    const os = tx.objectStore("saves");

    os.delete(id);

    tx.commit();

    return tx.done;
  }

  static load(config: SimConfig, data: string) {
    const save = JSON.parse(data);
    const sim = plainToInstance(Sim, save);
    config.systems.forEach((system) => system.apply(sim));
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
