import { createCollectible } from "@core/archetypes/collectible";
import type { Commodity } from "@core/economy/commodity";
import type { Sim } from "@core/sim";
import type { Matrix } from "mathjs";
import { add, random } from "mathjs";
import { Query } from "./utils/query";
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
        if (entity.cp.storage) {
          Object.entries(entity.cp.storage.stored).forEach(
            ([commodity, quantity]) => {
              if (quantity > 0) {
                createCollectible(this.sim, {
                  position: {
                    coord: add(entity.cp.position!.coord, [
                      random(-0.25, 0.25),
                      random(-0.25, 0.25),
                    ]) as Matrix,
                    sector: entity.cp.position!.sector,
                  },
                  storage: {
                    commodity: commodity as Commodity,
                    stored: quantity,
                  },
                });
              }
            }
          );
        }
        entity.unregister();
      }
    });
  };
}
