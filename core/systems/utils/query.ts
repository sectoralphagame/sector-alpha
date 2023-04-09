import { filter, map, pipe, toArray } from "@fxts/core";
import type { EntityTag } from "@core/tags";
import { shipComponents } from "@core/archetypes/ship";
import { collectibleComponents } from "@core/archetypes/collectible";
import { asteroidFieldComponents } from "../../archetypes/asteroidField";
import { facilityComponents } from "../../archetypes/facility";
import { factionComponents } from "../../archetypes/faction";
import { sectorComponents } from "../../archetypes/sector";
import type { CoreComponents } from "../../components/component";
import type { Entity } from "../../entity";
import { tradeComponents } from "../../economy/utils";
import type { Sim } from "../../sim";
import type { RequireComponent } from "../../tsHelpers";

type QueryEntities<T extends keyof CoreComponents> = Array<RequireComponent<T>>;

export class Query<T extends keyof CoreComponents> {
  entities: QueryEntities<T> | undefined;
  requiredComponents: readonly (keyof CoreComponents)[];
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

    sim.hooks.addComponent.tap("query", ({ entity, component }) => {
      if (
        this.entities &&
        this.requiredComponents.includes(component) &&
        this.canBeAdded(entity) &&
        !this.entities.find((e) => e === entity)
      ) {
        this.entities.push(entity as RequireComponent<T>);
      }
    });

    sim.hooks.removeComponent.tap("query", ({ component, entity }) => {
      if (this.entities && this.requiredComponents.includes(component)) {
        this.remove(entity);
      }
    });

    sim.hooks.addTag.tap("query", ({ entity, tag }) => {
      if (
        this.entities &&
        this.requiredTags.includes(tag) &&
        this.canBeAdded(entity) &&
        !this.entities.find((e) => e === entity)
      ) {
        this.entities.push(entity as RequireComponent<T>);
      }
    });

    sim.hooks.removeTag.tap("query", ({ tag, entity }) => {
      if (this.entities && this.requiredTags.includes(tag)) {
        this.remove(entity);
      }
    });

    sim.hooks.removeEntity.tap("query", (entity: Entity) => {
      if (this.entities) {
        this.remove(entity);
      }
    });
  }

  canBeAdded = (entity: Entity) =>
    entity.hasComponents(this.requiredComponents) &&
    entity.hasTags(this.requiredTags);

  remove = (entity: Entity) => {
    if (this.entities) {
      // Using splice breaks iterating
      // Example: Query holds array of 5 entities
      // During forEach loop 3rd entity is removed
      // Next iteration will take 5th entity, not 4th
      this.entities = this.entities.filter((e) => e.id !== entity.id);
    }
  };

  get = (): QueryEntities<T> => {
    if (!this.entities) {
      this.entities = pipe(
        this.sim.entities,
        filter(
          ([, e]) =>
            e.hasComponents(this.requiredComponents) &&
            e.hasTags(this.requiredTags)
        ),
        map(([, e]) => e),
        toArray
      ) as QueryEntities<T>;
    }

    return this.entities;
  };

  reset = (): void => {
    this.entities = undefined;
  };
}

export function createQueries(sim: Sim) {
  return {
    ai: new Query(sim, [...factionComponents, "ai"]),
    asteroidFields: new Query(sim, asteroidFieldComponents),
    autoOrderable: new Query(sim, ["autoOrder", "orders", "position"]),
    budget: new Query(sim, ["budget"]),
    builders: new Query(sim, ["builder", "storage", "trade", "docks"]),
    children: new Query(sim, ["parent"]),
    collectibles: new Query(sim, collectibleComponents, ["collectible"]),
    disposable: new Query(sim, ["disposable"]),
    facilities: new Query(sim, [
      "modules",
      "position",
      "facilityModuleQueue",
      "subordinates",
    ]),
    facilityWithProduction: new Query(sim, [
      "compoundProduction",
      "modules",
      "position",
    ]),
    mining: new Query(sim, ["mining", "storage"]),
    orderable: new Query(sim, ["orders", "position", "model", "owner"]),
    player: new Query(sim, factionComponents, ["player"]),
    productionByModules: new Query(sim, ["production", "parent"]),
    renderable: new Query(sim, ["render", "position"]),
    renderableGraphics: new Query(sim, ["renderGraphics"]),
    sectors: new Query(sim, sectorComponents),
    selectable: new Query(sim, ["render", "position"], ["selection"]),
    settings: new Query(sim, [
      "selectionManager",
      "systemManager",
      "inflationStats",
      "camera",
    ]),
    ships: new Query(sim, shipComponents, ["ship"]),
    shipyards: new Query(sim, [...facilityComponents, "owner", "shipyard"]),
    standaloneProduction: new Query(sim, ["production", "storage"]),
    storage: new Query(sim, ["storage"]),
    storageAndTrading: new Query(sim, ["storage", "trade"]),
    teleports: new Query(sim, ["teleport"]),
    trading: new Query(sim, tradeComponents),
  } as const;
}

export type Queries = ReturnType<typeof createQueries>;
