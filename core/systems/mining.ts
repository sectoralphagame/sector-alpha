import type { Sim } from "@core/sim";
// import { gameMonth } from "@core/utils/misc";
// import settings from "@core/settings";
import type { MineableCommodity } from "@core/economy/commodity";
import { addStorage } from "../components/storage";
import type { RequireComponent } from "../tsHelpers";
import { System } from "./system";

type WithMining = RequireComponent<"mining" | "storage">;
// const tickChance = 1 / 240;

function mine(entity: WithMining, delta: number) {
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
    entity.cp.mining.buffer += entity.cp.mining.efficiency * delta;
  }
}

export class MiningSystem extends System<"exec"> {
  apply = (sim: Sim): void => {
    super.apply(sim);

    sim.hooks.phase.update.subscribe(this.constructor.name, this.exec);
  };
  exec = (delta: number): void => {
    // if (!this.cooldowns.canUse("exec")) return;

    for (const entity of this.sim.index.mining.getIt()) {
      mine(entity, delta);
    }
    // this.cooldowns.use("exec", 1);
  };

  static getFieldEfficiencyFactor(
    field: RequireComponent<"mineable">,
    commodity: MineableCommodity
  ): number {
    return field.cp.mineable.density * field.cp.mineable.resources[commodity];
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
