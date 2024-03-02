import { pipe, map, uniq, flat, toArray } from "@fxts/core";
import type { Faction } from "../archetypes/faction";
import { getRequiredStorage } from "../components/production";
import type { Commodity } from "../economy/commodity";
import { commoditiesArray } from "../economy/commodity";
import type { Sim } from "../sim";
import type { RequireComponent } from "../tsHelpers";
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

  for (const commodity of commoditiesArray) {
    if (hasProduction) {
      const requiredStorage = getRequiredStorage(entity.cp.compoundProduction!);
      entity.cp.storage.quota[commodity] =
        requiredStorage === 0
          ? 0
          : Math.floor(
              (entity.cp.storage.max *
                (entity.cp.compoundProduction!.pac[commodity].produces +
                  entity.cp.compoundProduction!.pac[commodity].consumes)) /
                requiredStorage
            );
    } else if (entity.hasComponents(["shipyard", "owner"])) {
      entity.cp.storage.quota[commodity] = getShipyardQuota(
        entity.requireComponents(["storage", "shipyard", "owner"]),
        commodity
      );
    } else {
      entity.cp.storage.quota[commodity] = 0;
    }
  }
}

export class StorageQuotaPlanningSystem extends System<"settle"> {
  apply = (sim: Sim): void => {
    super.apply(sim);

    sim.hooks.phase.update.tap(this.constructor.name, this.exec);
  };

  exec = (): void => {
    if (this.cooldowns.canUse("settle")) {
      this.cooldowns.use("settle", 20);
      for (const entity of this.sim.queries.storageAndTrading.getIt()) {
        settleStorageQuota(entity);
      }
    }
  };
}
