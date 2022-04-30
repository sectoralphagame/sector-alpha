import { MissingEntityError } from "../errors";
import { Sim } from "../sim";
import { Entity } from "./entity";

export class Selection {}

let entityCounter = 0;

export class SelectionManager {
  focused: boolean = false;
  entity: Entity | null = null;
  id: number | null;

  constructor() {
    entityCounter++;

    if (entityCounter > 1 && process.env.NODE_ENV !== "test") {
      // eslint-disable-next-line no-console
      console.warn(
        "SelectionManager is meant to be singleton. Please make sure you know what you're doing."
      );
    }
  }

  load = (sim: Sim) => {
    if (this.id) {
      const entity = sim.entities.find((e) => e.id === this.id);
      if (!entity) {
        throw new MissingEntityError(this.id);
      }
      this.entity = entity;
    }
  };

  set = (entity: Entity) => {
    this.id = entity.id;
    this.entity = entity;
  };

  clear = () => {
    this.id = null;
    this.entity = null;
    this.focused = false;
  };
}
