import { Budget } from "./budget";
import type { Sim } from "../sim";
import { Owner } from "./owner";
import { Trade } from "./trade";
import { CommodityStorage } from "./storage";
import { Position } from "./position";

export interface CoreComponents {
  budget: Budget;
  owner: Owner;
  position: Position;
  storage: CommodityStorage;
  trade: Trade;
}

export abstract class Entity {
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

  hasComponents(components: Array<keyof CoreComponents>): boolean {
    return components.every((name) => !!this.components[name]);
  }
}
