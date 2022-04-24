import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import { Cooldowns } from "../utils/cooldowns";
import { perCommodity } from "../utils/perCommodity";
import { System } from "./system";

export class StorageQuotaPlanningSystem extends System {
  cooldowns: Cooldowns<"settle">;

  constructor(sim: Sim) {
    super(sim);
    this.cooldowns = new Cooldowns("settle");
  }

  query = () =>
    this.sim.entities.filter((e) => e.hasComponents(["storage"])) as Array<
      RequireComponent<"storage">
    >;

  exec = (delta: number): void => {
    this.cooldowns.update(delta);

    if (this.cooldowns.canUse("settle")) {
      this.cooldowns.use("settle", 20);
      this.query().forEach((entity) => {
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
      });
    }
  };
}
