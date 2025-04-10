import type { Sim } from "@core/sim";
// import { gameMonth } from "@core/utils/misc";
// import settings from "@core/settings";
import type { MineableCommodity } from "@core/economy/commodity";
import { asteroidField } from "@core/archetypes/asteroidField";
import { addStorage } from "../components/storage";
import type { RequireComponent } from "../tsHelpers";
import { System } from "./system";

type WithMining = RequireComponent<"mining" | "storage">;
// const tickChance = 1 / 240;
const baseMiningefficiency = 1.2;

export class MiningSystem extends System<"exec"> {
  apply = (sim: Sim): void => {
    super.apply(sim);

    sim.hooks.phase.update.subscribe(this.constructor.name, this.exec);
  };
  exec = (delta: number): void => {
    // if (!this.cooldowns.canUse("exec")) return;

    for (const entity of this.sim.index.mining.getIt()) {
      this.mine(entity, delta);
    }
    // this.cooldowns.use("exec", 1);
  };

  mine(entity: WithMining, delta: number) {
    if (entity.cp.mining.entityId && entity.cp.mining.resource) {
      if (entity.cooldowns.canUse("mine")) {
        entity.cooldowns.use("mine", 5);
        addStorage(
          entity.cp.storage,
          entity.cp.mining.resource,
          Math.floor(entity.cp.mining.buffer),
          false
        );
        entity.cp.mining.buffer = 0;
      }
      const field = asteroidField(
        this.sim.getOrThrow(entity.cp.mining.entityId)
      );
      entity.cp.mining.buffer +=
        entity.cp.mining.efficiency *
        delta *
        MiningSystem.getFieldEfficiencyFactor(field, entity.cp.mining.resource);
    }
  }

  static getFieldEfficiencyFactor(
    field: RequireComponent<"mineable">,
    commodity: MineableCommodity
  ): number {
    return (
      field.cp.mineable.density *
      field.cp.mineable.resources[commodity] *
      Math.min(
        1,
        field.cp.mineable.mountPoints.max /
          field.cp.mineable.mountPoints.used.length
      ) *
      baseMiningefficiency
    );
  }

  // static getExpectedMonthMiningValue(
  //   density: number,
  //   composition: number,
  //   efficiency: number
  // ): number {
  //   return (
  //     gameMonth *
  //     settings.global.targetFps *
  //     density *
  //     composition *
  //     efficiency *
  //     tickChance
  //   );
  // }
}

export const miningSystem = new MiningSystem();
