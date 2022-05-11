import { Sim } from "../sim";
import { Entity } from "./entity";

export class Parent {
  id: number;
  value: Entity;

  constructor(parent: Entity) {
    this.value = parent;
    this.id = parent.id;
  }

  load = (sim: Sim) => {
    this.value = sim.entities.find((e) => e.id === this.id);
  };
}
