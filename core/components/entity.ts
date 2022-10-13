import "reflect-metadata";
import { Expose, Exclude, Type } from "class-transformer";
import omit from "lodash/omit";
import reduce from "lodash/reduce";
import pick from "lodash/pick";
import type { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import { MissingComponentError } from "../errors";
import { Cooldowns } from "../utils/cooldowns";
import { isHeadless } from "../settings";
import { CoreComponents } from "./component";

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
  tags: Set<string>;
  @Expose()
  id: number;
  sim: Sim;
  deleted: boolean = false;

  constructor(sim?: Sim) {
    if (sim) {
      this.sim = sim;
      sim.registerEntity(this);
    }
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
    this.sim.events.emit("add-component", this);

    return this;
  }

  removeComponent(name: keyof CoreComponents) {
    delete this.components[name];
    this.sim.events.emit("remove-component", { name, entity: this });
  }

  unregister() {
    this.deleted = true;
    if (!isHeadless && this.cp.render) {
      this.cp.render.sprite.destroy();
    }
    this.sim.unregisterEntity(this);
  }

  toJSON() {
    return pick(this, ["components", "cooldowns", "id"]);
  }
}
