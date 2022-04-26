import { every } from "lodash";
import { PAC } from "../components/production";
import { CommodityStorage } from "../components/storage";
import { RequireComponent } from "../tsHelpers";
import { limitMax } from "../utils/limit";
import { perCommodity } from "../utils/perCommodity";
import { System } from "./system";

function produce(pac: PAC, storage: CommodityStorage) {
  perCommodity((commodity) =>
    storage.removeStorage(commodity, pac[commodity].consumes)
  );
  perCommodity((commodity) =>
    storage.addStorage(
      commodity,
      limitMax(
        storage.quota[commodity] - pac[commodity].produces,
        pac[commodity].produces
      ),
      false
    )
  );
}

export function isAbleToProduce(
  facilityModule: RequireComponent<"production">,
  storage: CommodityStorage
  // eslint-disable-next-line no-unused-vars
): boolean {
  return every(
    perCommodity(
      (commodity) =>
        storage.hasSufficientStorage(
          commodity,
          facilityModule.cp.production.pac[commodity].consumes
        ) &&
        (facilityModule.cp.production.pac[commodity].produces
          ? storage.getAvailableWares()[commodity] < storage.quota[commodity]
          : true)
    )
  );
}

export class ProducingSystem extends System {
  exec = (delta: number): void => {
    this.sim.queries.standaloneProduction.get().forEach((entity) => {
      entity.cp.production.cooldowns.update(delta);

      if (!isAbleToProduce(entity, entity.cp.storage)) {
        return;
      }

      entity.cp.production.cooldowns.use(
        "production",
        entity.cp.production.time
      );

      const storage = entity.cp.parent.value.cp.storage;

      produce(entity.cp.production.pac, storage);
    });

    this.sim.queries.productionByModules.get().forEach((facilityModule) => {
      facilityModule.cp.production.cooldowns.update(delta);

      if (
        !isAbleToProduce(
          facilityModule,
          facilityModule.cp.parent.value.cp.storage
        )
      ) {
        return;
      }

      facilityModule.cp.production.cooldowns.use(
        "production",
        facilityModule.cp.production.time
      );

      const storage = facilityModule.cp.parent.value.cp.storage;

      produce(facilityModule.cp.production.pac, storage);
    });
  };
}
