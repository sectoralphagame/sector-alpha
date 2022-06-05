import { every } from "lodash";
import { PAC } from "../components/production";
import {
  addStorage,
  CommodityStorage,
  hasSufficientStorage,
  removeStorage,
} from "../components/storage";
import { RequireComponent } from "../tsHelpers";
import { findInAncestors } from "../utils/findInAncestors";
import { limitMax } from "../utils/limit";
import { perCommodity } from "../utils/perCommodity";
import { System } from "./system";

function produce(pac: PAC, storage: CommodityStorage) {
  perCommodity((commodity) =>
    removeStorage(storage, commodity, pac[commodity].consumes)
  );
  perCommodity((commodity) =>
    addStorage(
      storage,
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
        hasSufficientStorage(
          storage,
          commodity,
          facilityModule.cp.production.pac[commodity].consumes
        ) &&
        (facilityModule.cp.production.pac[commodity].produces
          ? storage.availableWares[commodity] < storage.quota[commodity]
          : true)
    )
  );
}

export class ProducingSystem extends System {
  exec = (): void => {
    this.sim.queries.standaloneProduction.get().forEach((entity) => {
      if (!isAbleToProduce(entity, entity.cp.storage)) {
        return;
      }

      entity.cooldowns.use("production", entity.cp.production.time);

      produce(entity.cp.production.pac, entity.cp.storage);
    });

    this.sim.queries.productionByModules.get().forEach((facilityModule) => {
      const storage = findInAncestors(facilityModule, "storage").cp.storage;
      if (!isAbleToProduce(facilityModule, storage)) {
        return;
      }

      facilityModule.cooldowns.use(
        "production",
        facilityModule.cp.production.time
      );

      produce(facilityModule.cp.production.pac, storage);
    });
  };
}
