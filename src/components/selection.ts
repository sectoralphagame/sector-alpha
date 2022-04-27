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

    if (entityCounter > 1) {
      // eslint-disable-next-line no-console
      console.warn(
        "SelectionManager is meant to be singleton. Please make sure you know what you're doing."
      );
    }
  }

  load = (sim: Sim) => {
    if (this.id) {
      this.entity = sim.entities.find((e) => e.id === this.id);
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
