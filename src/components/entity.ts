import { Budget } from "./budget";
import type { Sim } from "../sim";
import { Owner } from "./owner";
import { Trade } from "./trade";

export interface CoreComponents {
  budget: Budget;
  owner: Owner;
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

  hasComponents(components: Array<keyof CoreComponents>): boolean {
    return components.every((name) => !!this.components[name]);
  }
}
