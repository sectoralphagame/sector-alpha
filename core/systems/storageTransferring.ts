import { gameDay } from "@core/utils/misc";
import { entityIndexer } from "@core/entityIndexer/entityIndexer";
import { System } from "./system";
import type { Sim } from "../sim";

const transferSpeed = 200 / gameDay;

export class StorageTransferringSystem extends System<"exec"> {
  apply = (sim: Sim) => {
    super.apply(sim);

    sim.hooks.phase.update.subscribe(this.constructor.name, this.exec);
  };

  exec = (delta: number): void => {
    if (!this.cooldowns.canUse("exec")) return;

    for (const entity of entityIndexer.search(["storage", "storageTransfer"])) {
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
