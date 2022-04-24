import { Sim } from "../../sim";
import { Entity } from "../entity";

export class SelectionManager {
  focused: boolean = false;
  entity: Entity | null = null;
  id: number | null;

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
