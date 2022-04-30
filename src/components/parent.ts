import { MissingEntityError } from "../errors";
import { Sim } from "../sim";
import { Entity } from "./entity";

export class Parent<T extends Entity = Entity> {
  id: number;
  value: T;

  constructor(parent: T) {
    this.value = parent;
    this.id = parent.id;
  }

  load = (sim: Sim) => {
    const entity = sim.entities.find((e) => e.id === this.id);
    if (!entity) {
      throw new MissingEntityError(this.id);
    }
    this.value = entity as T;
  };
}
