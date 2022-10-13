import { every } from "@fxts/core";
import { Production } from "../components/production";
import {
  addStorage,
  CommodityStorage,
  hasSufficientStorage,
  removeStorage,
} from "../components/storage";
import { commodities, Commodity } from "../economy/commodity";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import { Cooldowns } from "../utils/cooldowns";
import { findInAncestors } from "../utils/findInAncestors";
import { limitMax } from "../utils/limit";
import { perCommodity } from "../utils/perCommodity";
import { System } from "./system";

function produce(production: Production, storage: CommodityStorage) {
  const multiplier = production.time / 3600;

  perCommodity((commodity) =>
    removeStorage(
      storage,
      commodity,
      Math.floor(production.pac[commodity].consumes * multiplier)
    )
  );
  perCommodity((commodity) =>
    addStorage(
      storage,
      commodity,
      Math.floor(
        limitMax(
          storage.quota[commodity] -
            production.pac[commodity].produces * multiplier,
          production.pac[commodity].produces * multiplier
        )
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
  const multiplier = facilityModule.cp.production.time / 3600;
  return every(
    (commodity) =>
      hasSufficientStorage(
        storage,
        commodity,
        facilityModule.cp.production.pac[commodity].consumes * multiplier
      ) &&
      (facilityModule.cp.production.pac[commodity].produces * multiplier
        ? storage.availableWares[commodity] < storage.quota[commodity]
        : true),
    Object.values(commodities) as Commodity[]
  );
}

export class ProducingSystem extends System {
  cooldowns: Cooldowns<"exec">;

  constructor(sim: Sim) {
    super(sim);
    this.cooldowns = new Cooldowns("exec");
  }

  exec = (delta: number): void => {
    this.cooldowns.update(delta);
    if (!this.cooldowns.canUse("exec")) return;

    this.sim.queries.standaloneProduction.get().forEach((entity) => {
      if (!isAbleToProduce(entity, entity.cp.storage)) {
        return;
      }

      entity.cooldowns.use("production", entity.cp.production.time);

      produce(entity.cp.production, entity.cp.storage);
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

      produce(facilityModule.cp.production, storage);
    });
    this.cooldowns.use("exec", 2);
  };
}
