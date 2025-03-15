import "reflect-metadata";
import { Expose, Exclude, Type } from "class-transformer";
import omit from "lodash/omit";
import reduce from "lodash/reduce";
import pick from "lodash/pick";
import type { Sim } from "./sim";
import type { RequireComponent } from "./tsHelpers";
import { MissingComponentError } from "./errors";
import { Cooldowns } from "./utils/cooldowns";
import type { CoreComponents } from "./components/component";
import type { EntityTag } from "./tags";
import { componentMask } from "./components/masks";

export class EntityComponents {
  toJSON() {
    return reduce(
      Object.keys(this),
      (acc, key) => ({
        ...acc,
        [key]: omit(this[key], ["sim", "g", "sprite"]),
      }),
      {}
    );
  }
}

@Exclude()
export class Entity {
  @Expose()
  components = new EntityComponents() as Partial<CoreComponents>;
  componentsMask = BigInt(0);
  @Expose()
  @Type(() => Cooldowns)
  cooldowns = new Cooldowns<string>();
  @Expose()
  @Type(() => Set)
  tags: Set<EntityTag>;
  @Expose()
  createdAt: number;
  @Expose()
  id: number;
  sim: Sim;
  deleted: boolean = false;

  constructor(sim?: Sim) {
    if (sim) {
      this.sim = sim;
      this.createdAt = sim.getTime();
      sim.registerEntity(this);
    }

    this.tags = new Set();
  }

  get cp(): Partial<CoreComponents> {
    return this.components;
  }

  hasComponents<T extends Array<keyof CoreComponents>>(
    components: Readonly<T>
  ): this is RequireComponent<(typeof components)[number]> {
    return components.every((name) => !!this.components[name]);
  }

  requireComponents<T extends keyof CoreComponents>(
    components: Readonly<T[]>
  ): RequireComponent<T> {
    if (!components.every((name) => !!this.components[name])) {
      throw new MissingComponentError(this, components);
    }

    return this as unknown as RequireComponent<T>;
  }

  addComponent<T extends keyof CoreComponents>(
    component: CoreComponents[T]
  ): Entity {
    const componentName: CoreComponents[T]["name"] = component.name;
    const exists = !!this.components[componentName];
    this.components[componentName] = {
      ...component,
      mask: componentMask[componentName],
    };
    this.componentsMask |= componentMask[componentName];
    if (!exists) {
      this.sim.hooks.addComponent.notify({
        entity: this,
        component: component.name,
      });
    }

    return this;
  }

  removeComponent(name: keyof CoreComponents): Entity {
    this.componentsMask &= ~componentMask[name];
    delete this.components[name];
    this.sim.hooks.removeComponent.notify({ entity: this, component: name });

    return this;
  }

  addTag(tag: EntityTag): Entity {
    const hasTag = this.tags.has(tag);

    if (!hasTag) {
      this.tags.add(tag);
      this.sim.hooks.addTag.notify({ tag, entity: this });
    }

    return this;
  }

  removeTag(tag: EntityTag): Entity {
    this.tags.delete(tag);
    this.sim.hooks.removeTag.notify({ tag, entity: this });

    return this;
  }

  hasTags(tags: readonly EntityTag[]): boolean {
    return tags.every((tag) => this.tags.has(tag));
  }

  unregister(reason: string): void {
    this.deleted = true;
    this.sim.unregisterEntity(this, reason);
  }

  toJSON() {
    return {
      ...pick(this, ["components", "cooldowns", "id"]),
      tags: [...this.tags],
    };
  }
}

let pureEntityCounter = 0;
export class PureEntity {
  components = new EntityComponents() as Partial<CoreComponents>;
  cooldowns = new Cooldowns<string>();
  tags: Set<string>;
  id: number;

  constructor() {
    this.id = pureEntityCounter;
    pureEntityCounter++;
  }

  get cp(): Partial<CoreComponents> {
    return this.components;
  }
}
