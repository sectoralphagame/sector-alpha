import type { Sim } from "@core/sim";
import { asteroidField } from "../archetypes/asteroidField";
import { addStorage } from "../components/storage";
import type { RequireComponent } from "../tsHelpers";
import { System } from "./system";

type WithMining = RequireComponent<"mining" | "storage">;

function mine(entity: WithMining, delta: number) {
  if (entity.cp.mining.entityId) {
    if (entity.cooldowns.canUse("mine")) {
      entity.cooldowns.use("mine", 5);
      const mined = entity.sim
        .get(entity.cp.mining.entityId)!
        .requireComponents(["minable"]);
      addStorage(
        entity.cp.storage,
        mined.cp.minable.commodity,
        Math.floor(entity.cp.mining.buffer),
        false
      );
      mined.cp.minable.resources -= entity.cp.mining.buffer;
      entity.cp.mining.buffer = 0;

      if (mined.cp.minable.resources <= 0) {
        const field = asteroidField(entity.sim.get(mined.cp.parent!.id)!);
        field.cp.children.entities = field.cp.children.entities.filter(
          (e) => e !== mined.id
        );
        mined.unregister("mined");
        entity.cp.mining.entityId = null;
      }
    }
    entity.cp.mining.buffer += entity.cp.mining.efficiency * delta;
  }
}

export class MiningSystem extends System {
  apply = (sim: Sim): void => {
    super.apply(sim);

    sim.hooks.phase.update.subscribe(this.constructor.name, this.exec);
  };
  exec = (delta: number): void => {
    for (const entity of this.sim.index.mining.getIt()) {
      mine(entity, delta);
    }
  };
}

export const miningSystem = new MiningSystem();
