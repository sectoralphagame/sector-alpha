import { filter } from "@fxts/core";
import type { EntityTag } from "@core/tags";
import { shipComponents } from "@core/archetypes/ship";
import { collectibleComponents } from "@core/archetypes/collectible";
import { componentMask } from "@core/components/masks";
import { Observable } from "@core/utils/observer";
import { asteroidFieldComponents } from "../../archetypes/asteroidField";
import { facilityComponents } from "../../archetypes/facility";
import { factionComponents } from "../../archetypes/faction";
import { sectorComponents } from "../../archetypes/sector";
import type { CoreComponents } from "../../components/component";
import type { Entity } from "../../entity";
import { tradeComponents } from "../../economy/utils";
import type { Sim } from "../../sim";
import type { RequireComponent } from "../../tsHelpers";
import { SectorIndex } from "./sectorIndex";

export type IndexEntities<T extends keyof CoreComponents> = Array<
  RequireComponent<T>
>;

export class BaseIndex<T extends keyof CoreComponents> {
  hooks: {
    add: Observable<RequireComponent<T>>;
    remove: Observable<{ id: number; entity: Entity }>;
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
      add: new Observable("indexAdd"),
      remove: new Observable("indexRemove"),
    };

    this.sim.hooks.addComponent.subscribe("index", ({ entity, component }) => {
      if (
        this.requiredComponents.includes(component) &&
        this.canBeAdded(entity)
      ) {
        this.add(entity as RequireComponent<T>);
      }
    });

    this.sim.hooks.removeComponent.subscribe(
      "index",
      ({ component, entity }) => {
        if (this.requiredComponents.includes(component)) {
          this.remove(entity);
        }
      }
    );

    this.sim.hooks.addTag.subscribe("index", ({ entity, tag }) => {
      if (this.requiredTags.includes(tag) && this.canBeAdded(entity)) {
        this.add(entity as RequireComponent<T>);
      }
    });

    this.sim.hooks.removeTag.subscribe("index", ({ tag, entity }) => {
      if (this.requiredTags.includes(tag)) {
        this.remove(entity);
      }
    });

    this.sim.hooks.removeEntity.subscribe("index", (entity: Entity) => {
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
    this.hooks.add.notify(entity);
  };

  remove = (entity: Entity) => {
    this.hooks.remove.notify({ id: entity.id, entity });
  };
}

export class Index<T extends keyof CoreComponents> extends BaseIndex<T> {
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
    this.hooks.add.subscribe("index", (entity) => {
      if (this.entities) {
        this.entities.add(entity);
      }
    });
    this.hooks.remove.subscribe("index", ({ entity }) => {
      if (this.entities) {
        this.entities.delete(entity as RequireComponent<T>);
      }
    });
  };

  get = (): IndexEntities<T> => {
    if (this.cache) {
      if (!this.entities) {
        this.entities = new Set();
        this.collect();
      }

      return [...this.entities];
    }

    return this.sim.filter(this.canBeAdded) as IndexEntities<T>;
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
    ai: new Index(sim, [...factionComponents, "ai"]),
    asteroidFields: new Index(sim, asteroidFieldComponents, [], true),
    autoOrderable: new Index(sim, ["autoOrder", "orders", "position"]),
    budget: new Index(sim, ["budget"], [], true),
    builders: new Index(sim, ["builder", "storage", "trade", "docks"]),
    children: new Index(sim, ["parent"]),
    collectibles: new Index(sim, collectibleComponents, ["collectible"]),
    disposable: new Index(sim, ["disposable"]),
    facilities: new Index(
      sim,
      ["modules", "position", "facilityModuleQueue", "subordinates"],
      [],
      true
    ),
    facilityWithProduction: new Index(sim, [
      "compoundProduction",
      "modules",
      "position",
    ]),
    habitats: new Index(sim, ["parent", "facilityModuleBonus"]),
    mining: new Index(sim, ["mining", "storage"]),
    orderable: new Index(sim, ["orders", "position", "model", "owner"]),
    player: new Index(
      sim,
      [...factionComponents, "missions"],
      ["player"],
      true
    ),
    productionByModules: new Index(sim, ["production", "parent"]),
    renderableGraphics: new Index(sim, ["renderGraphics"]),
    sectors: new Index(sim, sectorComponents, [], true),
    selectable: new Index(sim, ["render", "position"], ["selection"]),
    settings: new Index(
      sim,
      ["selectionManager", "systemManager", "inflationStats", "camera"],
      [],
      true
    ),
    ships: new Index(sim, shipComponents, ["ship"]),
    shipyards: new Index(
      sim,
      [...facilityComponents, "owner", "shipyard"],
      [],
      true
    ),
    standaloneProduction: new Index(sim, ["production", "storage"]),
    storage: new Index(sim, ["storage"]),
    storageAndTrading: new Index(sim, ["storage", "trade"]),
    teleports: new Index(sim, ["teleport"], [], true),
    trading: new Index(sim, tradeComponents),
    bySectors: {
      trading: new SectorIndex(sim, tradeComponents),
    },
  } as const;
}

export type Queries = ReturnType<typeof createQueries>;
