import type { Sim } from "@core/sim";
import { System } from "./system";

export class CollectibleUnregisteringSystem extends System {
  apply = (sim: Sim) => {
    super.apply(sim);

    sim.hooks.subscribe("phase", ({ phase }) => {
      if (phase === "cleanup") {
        this.exec();
      }
    });
  };

  exec = (): void => {
    for (const entity of this.sim.index.collectibles.getIt()) {
      if (entity.cp.creationDate.date + 3600 < this.sim.getTime()) {
        entity.unregister("expired");
      }
    }
  };
}

export const collectibleUnregisteringSystem =
  new CollectibleUnregisteringSystem();
