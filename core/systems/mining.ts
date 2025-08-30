import type { Sim } from "@core/sim";
import { gameDay, gameMonth } from "@core/utils/misc";
import type { MineableCommodity } from "@core/economy/commodity";
import { asteroidField } from "@core/archetypes/asteroidField";
import { entityIndexer } from "@core/entityIndexer/entityIndexer";
import { addStorage } from "../components/storage";
import type { RequireComponent } from "../tsHelpers";
import { System } from "./system";

type WithMining = RequireComponent<"mining" | "storage">;
const tickChance = 1 / 4;
const baseMiningefficiency = 10;
const tickTime = gameDay / 4;

export class MiningSystem extends System<"exec"> {
  apply(sim: Sim): void {
    super.apply(sim);

    sim.hooks.subscribe("phase", ({ phase }) => {
      if (phase === "update") this.exec.bind(this);
    });
  }
  exec(): void {
    this.cooldowns.doEvery("exec", tickTime, () => {
      for (const entity of entityIndexer.search(["storage", "mining"])) {
        this.mine(entity);
      }
    });
  }

  mine(entity: WithMining) {
    if (
      !(
        entity.cp.mining.entityId &&
        entity.cp.mining.resource &&
        Math.random() < entity.cp.mining.efficiency * tickChance
      )
    )
      return;

    const field = asteroidField(this.sim.getOrThrow(entity.cp.mining.entityId));
    addStorage(
      entity.cp.storage,
      entity.cp.mining.resource,
      Math.floor(
        MiningSystem.getFieldEfficiencyFactor(field, entity.cp.mining.resource)
      ),
      false
    );
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

  static getExpectedMonthMiningValue(
    density: number,
    composition: number,
    efficiency: number
  ): number {
    return (
      (gameMonth / tickTime) * density * composition * efficiency * tickChance
    );
  }
}

export const miningSystem = new MiningSystem();
