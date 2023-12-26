import { filter } from "@fxts/core";
import type { EntityTag } from "@core/tags";
import { shipComponents } from "@core/archetypes/ship";
import { collectibleComponents } from "@core/archetypes/collectible";
import { SyncHook } from "tapable";
import { componentMask } from "@core/components/masks";
import { asteroidFieldComponents } from "../../archetypes/asteroidField";
import { facilityComponents } from "../../archetypes/facility";
import { factionComponents } from "../../archetypes/faction";
import { sectorComponents } from "../../archetypes/sector";
import type { CoreComponents } from "../../components/component";
import type { Entity } from "../../entity";
import { tradeComponents } from "../../economy/utils";
import type { Sim } from "../../sim";
import type { RequireComponent } from "../../tsHelpers";
import { SectorQuery } from "./sectorQuery";

export type QueryEntities<T extends keyof CoreComponents> = Array<
  RequireComponent<T>
>;

export class BaseQuery<T extends keyof CoreComponents> {
  hooks: {
    add: SyncHook<RequireComponent<T>>;
    remove: SyncHook<[number, Entity]>;
  };
  requiredComponents: readonly (keyof CoreComponents)[];
  requiredComponentsMask: bigint;
  requiredTags: readonly EntityTag[];
  sim: Sim;

  constructor(
    sim: Sim,
    requiredComponents: readonly T[],
    requiredTags: readonly EntityTag[] = []
  ) {
    this.requiredComponents = requiredComponents;
    this.requiredTags = requiredTags;
    this.sim = sim;

    this.requiredComponentsMask = requiredComponents.reduce(
      (mask, name) => mask | componentMask[name],
      BigInt(0)
    );
  }

  enableHooks = () => {
    this.hooks = {
      add: new SyncHook(["entity"]),
      remove: new SyncHook(["entityId", "entity"]),
    };

    this.sim.hooks.addComponent.tap("query", ({ entity, component }) => {
      if (
        this.requiredComponents.includes(component) &&
        this.canBeAdded(entity)
      ) {
        this.add(entity as RequireComponent<T>);
      }
    });

    this.sim.hooks.removeComponent.tap("query", ({ component, entity }) => {
      if (this.requiredComponents.includes(component)) {
        this.remove(entity);
      }
    });

    this.sim.hooks.addTag.tap("query", ({ entity, tag }) => {
      if (this.requiredTags.includes(tag) && this.canBeAdded(entity)) {
        this.add(entity as RequireComponent<T>);
      }
    });

    this.sim.hooks.removeTag.tap("query", ({ tag, entity }) => {
      if (this.requiredTags.includes(tag)) {
        this.remove(entity);
      }
    });

    this.sim.hooks.removeEntity.tap("query", (entity: Entity) => {
      this.remove(entity);
    });
  };

  canBeAdded = (entity: Entity) =>
    (entity.componentsMask & this.requiredComponentsMask) ===
      this.requiredComponentsMask && entity.hasTags(this.requiredTags);

  collect = () => {
    for (const entity of filter(this.canBeAdded, this.sim.entities.values())) {
      this.add(entity as RequireComponent<T>);
    }
  };

  add = (entity: RequireComponent<T>) => {
    this.hooks.add.call(entity);
  };

  remove = (entity: Entity) => {
    this.hooks.remove.call(entity.id, entity);
  };
}

export class Query<T extends keyof CoreComponents> extends BaseQuery<T> {
  cache: boolean;
  entities: Set<RequireComponent<T>> | null;
  sim: Sim;

  constructor(
    sim: Sim,
    requiredComponents: readonly T[],
    requiredTags: readonly EntityTag[] = [],
    cache = false
  ) {
    super(sim, requiredComponents, requiredTags);
    if (cache) {
      this.enableCache();
    }
  }

  enableCache = () => {
    this.cache = true;
    this.enableHooks();
    this.hooks.add.tap("query", (entity) => {
      if (this.entities) {
        this.entities.add(entity);
      }
    });
    this.hooks.remove.tap("query", (_id, entity) => {
      if (this.entities) {
        this.entities.delete(entity as RequireComponent<T>);
      }
    });
  };

  get = (): QueryEntities<T> => {
    if (this.cache) {
      if (!this.entities) {
        this.entities = new Set();
        this.collect();
      }

      return [...this.entities];
    }

    return this.sim.filter(this.canBeAdded) as QueryEntities<T>;
  };

  getIt = (): IterableIterator<RequireComponent<T>> => {
    if (this.cache) {
      if (!this.entities) {
        this.entities = new Set();
        this.collect();
      }

      return this.entities.values();
    }

    return filter(this.canBeAdded, this.sim.entities.values()) as any;
  };

  reset = (): void => {
    if (!this.cache || !this.entities) return;

    this.entities.clear();
    this.collect();
  };
}

export function createQueries(sim: Sim) {
  return {
    ai: new Query(sim, [...factionComponents, "ai"]),
    asteroidFields: new Query(sim, asteroidFieldComponents, [], true),
    autoOrderable: new Query(sim, ["autoOrder", "orders", "position"]),
    budget: new Query(sim, ["budget"], [], true),
    builders: new Query(sim, ["builder", "storage", "trade", "docks"]),
    children: new Query(sim, ["parent"]),
    collectibles: new Query(sim, collectibleComponents, ["collectible"]),
    disposable: new Query(sim, ["disposable"]),
    facilities: new Query(
      sim,
      ["modules", "position", "facilityModuleQueue", "subordinates"],
      [],
      true
    ),
    facilityWithProduction: new Query(sim, [
      "compoundProduction",
      "modules",
      "position",
    ]),
    mining: new Query(sim, ["mining", "storage"]),
    orderable: new Query(sim, ["orders", "position", "model", "owner"]),
    player: new Query(sim, [...factionComponents, "missions"], ["player"]),
    productionByModules: new Query(sim, ["production", "parent"]),
    renderable: new Query(sim, ["render", "position"]),
    renderableGraphics: new Query(sim, ["renderGraphics"]),
    sectors: new Query(sim, sectorComponents, [], true),
    selectable: new Query(sim, ["render", "position"], ["selection"]),
    settings: new Query(
      sim,
      ["selectionManager", "systemManager", "inflationStats", "camera"],
      [],
      true
    ),
    ships: new Query(sim, shipComponents, ["ship"]),
    shipyards: new Query(
      sim,
      [...facilityComponents, "owner", "shipyard"],
      [],
      true
    ),
    standaloneProduction: new Query(sim, ["production", "storage"]),
    storage: new Query(sim, ["storage"]),
    storageAndTrading: new Query(sim, ["storage", "trade"]),
    teleports: new Query(sim, ["teleport"], [], true),
    trading: new Query(sim, tradeComponents),
    bySectors: {
      trading: new SectorQuery(sim, tradeComponents),
    },
  } as const;
}

export type Queries = ReturnType<typeof createQueries>;
