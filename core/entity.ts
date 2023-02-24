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
  @Expose()
  @Type(() => Cooldowns)
  cooldowns = new Cooldowns<string>();
  @Expose()
  @Type(() => Set)
  tags: Set<EntityTag>;
  @Expose()
  id: number;
  sim: Sim;
  deleted: boolean = false;

  constructor(sim?: Sim) {
    if (sim) {
      this.sim = sim;
      sim.registerEntity(this);
    }

    this.tags = new Set();
  }

  get cp(): Partial<CoreComponents> {
    return this.components;
  }

  hasComponents(components: Readonly<Array<keyof CoreComponents>>): boolean {
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
    this.components[componentName] = component;
    this.sim.hooks.addComponent.call({
      entity: this,
      component: component.name,
    });

    return this;
  }

  removeComponent(name: keyof CoreComponents): Entity {
    delete this.components[name];
    this.sim.hooks.removeComponent.call({ entity: this, component: name });

    return this;
  }

  addTag(tag: EntityTag): Entity {
    this.tags.add(tag);
    this.sim.hooks.addTag.call({ tag, entity: this });

    return this;
  }

  removeTag(tag: EntityTag): Entity {
    this.tags.delete(tag);
    this.sim.hooks.removeTag.call({ tag, entity: this });

    return this;
  }

  hasTags(tags: readonly EntityTag[]): boolean {
    return tags.every((tag) => this.tags.has(tag));
  }

  unregister() {
    this.deleted = true;
    this.sim.unregisterEntity(this);
  }

  toJSON() {
    return {
      ...pick(this, ["components", "cooldowns", "id"]),
      tags: [...this.tags],
    };
  }
}

export class PureEntity {
  components = new EntityComponents() as Partial<CoreComponents>;
  cooldowns = new Cooldowns<string>();
  tags: Set<string>;
  id: number;

  get cp(): Partial<CoreComponents> {
    return this.components;
  }
}
