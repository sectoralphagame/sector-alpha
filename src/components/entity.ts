import type { Sim } from "../sim";

export abstract class Entity {
  id: number;
  sim: Sim;

  constructor(sim: Sim) {
    this.sim = sim;
    sim.registerEntity(this);
  }
}
