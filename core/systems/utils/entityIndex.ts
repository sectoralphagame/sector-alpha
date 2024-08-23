import { filter } from "@fxts/core";
import type { EntityTag } from "@core/tags";

import { componentMask } from "@core/components/masks";
import { Observable } from "@core/utils/observer";

import type { CoreComponents } from "../../components/component";
import type { Entity } from "../../entity";
import type { Sim } from "../../sim";
import type { RequireComponent } from "../../tsHelpers";
import type { SimIndex } from "./simIndex";

export class IndexNotAppliedError extends Error {
  constructor() {
    super("Index not applied to the sim");
  }
}

export type IndexEntities<T extends keyof CoreComponents> = Array<
  RequireComponent<T>
>;

export abstract class BaseEntityIndex<T extends keyof CoreComponents>
  implements SimIndex<Entity>
{
  hooks: {
    add: Observable<RequireComponent<T>>;
    remove: Observable<{ id: number; entity: Entity }>;
  };
  requiredComponents: readonly (keyof CoreComponents)[];
  requiredComponentsMask: bigint;
  requiredTags: readonly EntityTag[];
  sim: Sim | null = null;

  constructor(
    requiredComponents: readonly T[],
    requiredTags: readonly EntityTag[] = []
  ) {
    this.requiredComponents = requiredComponents;
    this.requiredTags = requiredTags;

    this.requiredComponentsMask = requiredComponents.reduce(
      (mask, name) => mask | componentMask[name],
      BigInt(0)
    );
  }

  apply(sim: Sim): void {
    this.sim = sim;
    this.enableHooks();
    this.collect();

    this.sim.hooks.destroy.subscribe("BaseEntityIndex", () => {
      this.reset();
    });
  }

  abstract clear(): void;
  abstract reset(): void;

  enableHooks = () => {
    if (this.sim === null) {
      throw new IndexNotAppliedError();
    }

    this.hooks = {
      add: new Observable("indexAdd"),
      remove: new Observable("indexRemove"),
    };

    this.sim.hooks.addComponent.subscribe(
      "BaseEntityIndex",
      ({ entity, component }) => {
        if (
          this.requiredComponents.includes(component) &&
          this.canBeAdded(entity)
        ) {
          this.add(entity as RequireComponent<T>);
        }
      }
    );

    this.sim.hooks.removeComponent.subscribe(
      "BaseEntityIndex",
      ({ component, entity }) => {
        if (this.requiredComponents.includes(component)) {
          this.remove(entity);
        }
      }
    );

    this.sim.hooks.addTag.subscribe("BaseEntityIndex", ({ entity, tag }) => {
      if (this.requiredTags.includes(tag) && this.canBeAdded(entity)) {
        this.add(entity as RequireComponent<T>);
      }
    });

    this.sim.hooks.removeTag.subscribe("BaseEntityIndex", ({ tag, entity }) => {
      if (this.requiredTags.includes(tag)) {
        this.remove(entity);
      }
    });

    this.sim.hooks.removeEntity.subscribe("BaseEntityIndex", (entity) => {
      this.remove(entity);
    });
  };

  canBeAdded = (entity: Entity) =>
    (entity.componentsMask & this.requiredComponentsMask) ===
      this.requiredComponentsMask && entity.hasTags(this.requiredTags);

  collect(): void {
    if (this.sim === null) {
      throw new IndexNotAppliedError();
    }

    for (const entity of filter(this.canBeAdded, this.sim.entities.values())) {
      this.add(entity as RequireComponent<T>);
    }
  }

  add = (entity: RequireComponent<T>) => {
    if (this.sim === null) {
      throw new IndexNotAppliedError();
    }

    this.hooks.add.notify(entity);
  };

  remove = (entity: Entity) => {
    if (this.sim === null) {
      throw new IndexNotAppliedError();
    }

    this.hooks.remove.notify({ id: entity.id, entity });
  };
}

export class EntityIndex<
  T extends keyof CoreComponents
> extends BaseEntityIndex<T> {
  cache: boolean;
  entities: Set<RequireComponent<T>>;
  populated = false;

  constructor(
    requiredComponents: readonly T[],
    requiredTags: readonly EntityTag[] = [],
    cache = false
  ) {
    super(requiredComponents, requiredTags);
    this.cache = cache;
  }

  apply = (sim: Sim): void => {
    super.apply(sim);
    this.entities = new Set();
    if (this.cache) {
      this.enableCache();
    }
  };

  enableCache = () => {
    this.enableHooks();
    this.hooks.add.subscribe("EntityIndex", (entity) => {
      this.entities.add(entity);
    });
    this.hooks.remove.subscribe("EntityIndex", ({ entity }) => {
      this.entities.delete(entity as RequireComponent<T>);
    });
    this.collect();
  };

  collect(): void {
    super.collect();

    this.populated = true;
  }

  get = (): IndexEntities<T> => {
    if (this.sim === null) {
      throw new IndexNotAppliedError();
    }

    if (this.cache) {
      return [...this.entities];
    }

    return this.sim.filter(this.canBeAdded) as IndexEntities<T>;
  };

  getIt = (): IterableIterator<RequireComponent<T>> => {
    if (this.sim === null) {
      throw new IndexNotAppliedError();
    }

    if (this.cache) {
      return this.entities.values();
    }

    return filter(this.canBeAdded, this.sim.entities.values()) as any;
  };

  clear = (): void => {
    this.entities.clear();
  };

  reset = (): void => {
    if (this.sim === null) {
      throw new IndexNotAppliedError();
    }

    this.clear();
    this.sim = null;
  };
}
