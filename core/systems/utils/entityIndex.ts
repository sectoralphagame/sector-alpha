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

export class BaseEntityIndex<T extends keyof CoreComponents> {
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

export class EntityIndex<
  T extends keyof CoreComponents
> extends BaseEntityIndex<T> {
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

export function createIndexes(sim: Sim) {
  return {
    ai: new EntityIndex(sim, [...factionComponents, "ai"]),
    asteroidFields: new EntityIndex(sim, asteroidFieldComponents, [], true),
    autoOrderable: new EntityIndex(sim, ["autoOrder", "orders", "position"]),
    budget: new EntityIndex(sim, ["budget"], [], true),
    builders: new EntityIndex(sim, ["builder", "storage", "trade", "docks"]),
    children: new EntityIndex(sim, ["parent"]),
    collectibles: new EntityIndex(sim, collectibleComponents, ["collectible"]),
    disposable: new EntityIndex(sim, ["disposable"]),
    facilities: new EntityIndex(
      sim,
      ["modules", "position", "facilityModuleQueue", "subordinates"],
      [],
      true
    ),
    facilityWithProduction: new EntityIndex(sim, [
      "compoundProduction",
      "modules",
      "position",
    ]),
    habitats: new EntityIndex(sim, ["parent", "facilityModuleBonus"]),
    mining: new EntityIndex(sim, ["mining", "storage"]),
    orderable: new EntityIndex(sim, ["orders", "position", "model", "owner"]),
    player: new EntityIndex(
      sim,
      [...factionComponents, "missions"],
      ["player"],
      true
    ),
    productionByModules: new EntityIndex(sim, ["production", "parent"]),
    renderableGraphics: new EntityIndex(sim, ["renderGraphics"]),
    sectors: new EntityIndex(sim, sectorComponents, [], true),
    selectable: new EntityIndex(sim, ["render", "position"], ["selection"]),
    settings: new EntityIndex(
      sim,
      ["selectionManager", "systemManager", "inflationStats", "camera"],
      [],
      true
    ),
    ships: new EntityIndex(sim, shipComponents, ["ship"], true),
    shipyards: new EntityIndex(
      sim,
      [...facilityComponents, "owner", "shipyard"],
      [],
      true
    ),
    standaloneProduction: new EntityIndex(sim, ["production", "storage"]),
    storage: new EntityIndex(sim, ["storage"]),
    storageAndTrading: new EntityIndex(sim, ["storage", "trade"]),
    teleports: new EntityIndex(sim, ["teleport"], [], true),
    trading: new EntityIndex(sim, tradeComponents),
    bySectors: {
      trading: new SectorIndex(sim, tradeComponents),
    },
  } as const;
}

export type Indexes = ReturnType<typeof createIndexes>;
