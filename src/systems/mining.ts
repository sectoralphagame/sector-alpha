import { addStorage } from "../components/storage";
import { RequireComponent } from "../tsHelpers";
import { System } from "./system";

type WithMining = RequireComponent<"mining" | "storage">;

function mine(entity: WithMining, delta: number) {
  if (entity.cp.mining.entityId) {
    if (entity.cooldowns.canUse("mine")) {
      entity.cooldowns.use("mine", 5);
      addStorage(
        entity.cp.storage,
        entity.sim.get(entity.cp.mining.entityId).requireComponents(["minable"])
          .cp.minable.commodity,
        Math.floor(entity.cp.mining.buffer),
        false
      );
      entity.cp.mining.buffer = 0;
    }
    entity.cp.mining.buffer += entity.cp.mining.efficiency * delta;
  }
}

export class MiningSystem extends System {
  exec = (delta: number): void => {
    this.sim.queries.mining.get().forEach((entity) => mine(entity, delta));
  };
}
