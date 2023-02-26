import type { Sim } from "@core/sim";
import { Query } from "./query";
import { System } from "./system";

export class DeadUnregisteringSystem extends System {
  query: Query<"hitpoints">;

  constructor(sim: Sim) {
    super(sim);
    this.query = new Query(sim, ["hitpoints"]);
  }

  exec = (): void => {
    this.query.get().forEach((entity) => {
      if (entity.cp.hitpoints.hp.value <= 0) {
        entity.unregister();
      }
    });
  };
}
