import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import { Cooldowns } from "../utils/cooldowns";
import { perCommodity } from "../utils/perCommodity";
import { System } from "./system";

export function settleStorageQuota(entity: RequireComponent<"storage">) {
  const hasProduction =
    entity.hasComponents(["production"]) ||
    entity.hasComponents(["compoundProduction"]);
  entity.cp.storage.updateQuota(
    perCommodity((commodity) => {
      if (hasProduction) {
        return Math.floor(
          (entity.cp.storage.max *
            (entity.cp.compoundProduction.pac[commodity].produces +
              entity.cp.compoundProduction.pac[commodity].consumes)) /
            entity.cp.compoundProduction.getRequiredStorage()
        );
      }

      return entity.cp.storage.max;
    })
  );
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
