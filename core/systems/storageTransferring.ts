import { gameDay } from "@core/utils/misc";
import { System } from "./system";
import type { Sim } from "../sim";
import { EntityIndex } from "./utils/entityIndex";

const transferSpeed = 200 / gameDay;

export class StorageTransferringSystem extends System<"exec"> {
  transferringUnits: EntityIndex<"storage" | "storageTransfer">;

  apply = (sim: Sim) => {
    super.apply(sim);

    this.transferringUnits = new EntityIndex(sim, [
      "storage",
      "storageTransfer",
    ]);
    sim.hooks.phase.update.subscribe(this.constructor.name, this.exec);
  };

  exec = (delta: number): void => {
    if (!this.cooldowns.canUse("exec")) return;

    for (const entity of this.transferringUnits.getIt()) {
      entity.cp.storageTransfer.transferred += transferSpeed * delta;

      if (
        entity.cp.storageTransfer.transferred >=
        entity.cp.storageTransfer.amount
      ) {
        entity.removeComponent("storageTransfer").removeTag("busy");
      }
    }
  };
}

export const storageTransferringSystem = new StorageTransferringSystem();
