import { RequireComponent } from "../tsHelpers";
import { System } from "./system";

type WithMining = RequireComponent<"mining" | "storage">;

function mine(entity: WithMining, delta: number) {
  entity.cp.mining.cooldowns.update(delta);

  if (entity.cp.mining.asteroid) {
    if (entity.cp.mining.cooldowns.canUse("mine")) {
      entity.cp.mining.cooldowns.use("mine", 5);
      entity.cp.storage.addStorage(
        entity.cp.mining.asteroid.field.type,
        Math.floor(entity.cp.mining.buffer),
        false
      );
      entity.cp.mining.buffer = 0;
    }
    entity.cp.mining.buffer += entity.cp.mining.efficiency * delta;
  }
}

export class MiningSystem extends System {
  query = () =>
    this.sim.entities.filter((e) =>
      e.hasComponents(["mining", "storage"])
    ) as WithMining[];

  exec = (delta: number): void => {
    this.query().forEach((entity) => mine(entity, delta));
  };
}
