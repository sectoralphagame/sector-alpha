import { getRequiredStorage } from "../components/production";
import { commoditiesArray } from "../economy/commodity";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import { Cooldowns } from "../utils/cooldowns";
import { System } from "./system";

export function settleStorageQuota(entity: RequireComponent<"storage">) {
  const hasProduction = entity.hasComponents(["compoundProduction"]);

  commoditiesArray.forEach((commodity) => {
    if (hasProduction) {
      entity.cp.storage.quota[commodity] = Math.floor(
        (entity.cp.storage.max *
          (entity.cp.compoundProduction!.pac[commodity].produces +
            entity.cp.compoundProduction!.pac[commodity].consumes)) /
          getRequiredStorage(entity.cp.compoundProduction!)
      );
    } else {
      entity.cp.storage.quota[commodity] = entity.cp.storage.max;
    }
  });
}

export class StorageQuotaPlanningSystem extends System {
  cooldowns: Cooldowns<"settle">;

  constructor(sim: Sim) {
    super(sim);
    this.cooldowns = new Cooldowns("settle");
  }

  exec = (delta: number): void => {
    this.cooldowns.update(delta);

    if (this.cooldowns.canUse("settle")) {
      this.cooldowns.use("settle", 20);
      this.sim.queries.storageAndTrading.get().forEach(settleStorageQuota);
    }
  };
}
