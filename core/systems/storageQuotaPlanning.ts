import { pipe, map, uniq, flat, toArray } from "@fxts/core";
import type { Faction } from "../archetypes/faction";
import { getRequiredStorage } from "../components/production";
import type { Commodity } from "../economy/commodity";
import { commoditiesArray } from "../economy/commodity";
import type { Sim } from "../sim";
import type { RequireComponent } from "../tsHelpers";
import { Cooldowns } from "../utils/cooldowns";
import { System } from "./system";

function getShipyardQuota(
  entity: RequireComponent<"storage" | "owner" | "shipyard">,
  commodity: Commodity
): number {
  const needed = pipe(
    entity.sim.getOrThrow<Faction>(entity.cp.owner.id).cp.blueprints.ships,
    map((blueprint) => Object.keys(blueprint.build.cost)),
    flat,
    uniq,
    toArray
  );

  if (!needed.includes(commodity)) {
    return 0;
  }

  return Math.floor(entity.cp.storage.max / needed.length);
}

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
    } else if (entity.hasComponents(["shipyard", "owner"])) {
      entity.cp.storage.quota[commodity] = getShipyardQuota(
        entity.requireComponents(["storage", "shipyard", "owner"]),
        commodity
      );
    } else {
      entity.cp.storage.quota[commodity] = 0;
    }
  });
}

export class StorageQuotaPlanningSystem extends System {
  cooldowns: Cooldowns<"settle">;

  constructor() {
    super();
    this.cooldowns = new Cooldowns("settle");
  }

  apply = (sim: Sim): void => {
    super.apply(sim);

    sim.hooks.phase.update.tap(this.constructor.name, this.exec);
  };

  exec = (delta: number): void => {
    this.cooldowns.update(delta);

    if (this.cooldowns.canUse("settle")) {
      this.cooldowns.use("settle", 20);
      this.sim.queries.storageAndTrading.get().forEach(settleStorageQuota);
    }
  };
}
