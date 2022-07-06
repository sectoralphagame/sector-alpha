import "reflect-metadata";
import { Expose, Exclude, Type } from "class-transformer";
import omit from "lodash/omit";
import reduce from "lodash/reduce";
import pick from "lodash/pick";
import { Budget } from "./budget";
import type { Sim } from "../sim";
import { Owner } from "./owner";
import { Trade } from "./trade";
import { CommodityStorage } from "./storage";
import { Position } from "./position";
import { CompoundProduction, Production } from "./production";
import { Parent } from "./parent";
import { StorageBonus } from "./storageBonus";
import { Modules } from "./modules";
import { Name } from "./name";
import { Selection, SelectionManager } from "./selection";
import { Render } from "./render";
import { RenderGraphics } from "./renderGraphics";
import { AutoOrder } from "./autoOrder";
import { Drive } from "./drive";
import { Mining } from "./mining";
import { Minable } from "./minable";
import { AsteroidSpawn } from "./asteroidSpawn";
import { Children } from "./children";
import { Orders } from "./orders";
import { RequireComponent } from "../tsHelpers";
import { MissingComponentError } from "../errors";
import { HECSPosition } from "./hecsPosition";
import { Teleport } from "./teleport";
import { Docks, Dockable } from "./dockable";
import { Cooldowns } from "../utils/cooldowns";
import { Commander } from "./commander";
import { Color } from "./color";
import { Ai } from "./ai";
import { isTest } from "../settings";
import { DestroyAfterUsage } from "./destroyAfterUsage";
import { SectorStats } from "./sectorStats";
import { SystemManager } from "./systemManager";

export interface CoreComponents {
  ai: Ai;
  asteroidSpawn: AsteroidSpawn;
  autoOrder: AutoOrder;
  budget: Budget;
  children: Children;
  color: Color;
  commander: Commander;
  compoundProduction: CompoundProduction;
  destroyAfterUsage: DestroyAfterUsage;
  dockable: Dockable;
  docks: Docks;
  drive: Drive;
  hecsPosition: HECSPosition;
  minable: Minable;
  mining: Mining;
  modules: Modules;
  name: Name;
  orders: Orders;
  owner: Owner;
  parent: Parent;
  position: Position;
  production: Production;
  render: Render;
  renderGraphics: RenderGraphics<any>;
  sectorStats: SectorStats;
  selection: Selection;
  selectionManager: SelectionManager;
  storage: CommodityStorage;
  storageBonus: StorageBonus;
  systemManager: SystemManager;
  teleport: Teleport;
  trade: Trade;
}

class EntityComponents {
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
    if (!isTest && this.cp.render) {
      this.cp.render.sprite.destroy();
    }
    this.sim.unregisterEntity(this);
  }

  toJSON() {
    return pick(this, ["components", "cooldowns", "id"]);
  }
}
