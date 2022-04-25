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
}
