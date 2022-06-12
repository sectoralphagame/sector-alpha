import { addStorage } from "../components/storage";
import { RequireComponent } from "../tsHelpers";
import { System } from "./system";

type WithMining = RequireComponent<"mining" | "storage">;

function mine(entity: WithMining, delta: number) {
  if (entity.cp.mining.entityId) {
    if (entity.cooldowns.canUse("mine")) {
      entity.cooldowns.use("mine", 5);
      const mined = entity.sim
        .get(entity.cp.mining.entityId)
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
        mined.unregister();
        entity.cp.mining.entityId = null;
      }
    }
    entity.cp.mining.buffer += entity.cp.mining.efficiency * delta;
  }
}

export class MiningSystem extends System {
  exec = (delta: number): void => {
    this.sim.queries.mining.get().forEach((entity) => mine(entity, delta));
  };
}
