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
import { AutoOrder } from "./autoOrder";
import { Drive } from "./drive";
import { Mining } from "./mining";
import { Minable } from "./minable";
import { AsteroidSpawn } from "./asteroidSpawn";
import { Children } from "./children";
import { Orders } from "./orders";
import { RequireComponent } from "../tsHelpers";
import { MissingComponentError } from "../errors";

export interface CoreComponents {
  asteroidSpawn: AsteroidSpawn;
  autoOrder: AutoOrder;
  budget: Budget;
  children: Children;
  commander: Parent; // Essentially the same
  compoundProduction: CompoundProduction;
  drive: Drive;
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
  selection: Selection;
  selectionManager: SelectionManager;
  storage: CommodityStorage;
  storageBonus: StorageBonus;
  trade: Trade;
}

export class Entity {
  components: Partial<CoreComponents> = {};
  id: number;
  sim: Sim;

  constructor(sim: Sim) {
    this.sim = sim;
    sim.registerEntity(this);
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
    name: T,
    component: CoreComponents[T]
  ) {
    this.components[name] = component;
    this.sim.events.emit("add-component", this);
  }

  removeComponent(name: keyof CoreComponents) {
    delete this.components[name];
    this.sim.events.emit("remove-component", { name, entity: this });
  }
}
