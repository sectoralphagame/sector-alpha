import { maxMood, minMood } from "@core/components/crew";
import { getRequiredCrew } from "@core/utils/crew";
import { gameDay, gameMonth } from "@core/utils/misc";
import { every, sum } from "@fxts/core";
import type { Production } from "../components/production";
import type { CommodityStorage } from "../components/storage";
import {
  addStorage,
  hasSufficientStorage,
  removeStorage,
} from "../components/storage";
import type { Commodity } from "../economy/commodity";
import type { Sim } from "../sim";
import type { RequireComponent } from "../tsHelpers";
import { findInAncestors } from "../utils/findInAncestors";
import { perCommodity } from "../utils/perCommodity";
import { System } from "./system";

export function getMoodMultiplier(mood: number): number {
  const maxPenalty = 0.5;
  const maxBonus = 1.3;

  const a = (maxBonus - maxPenalty) / (maxMood - minMood);
  const b = maxPenalty - a * minMood;

  return a * mood + b - 1;
}

export function getCrewMultiplier(
  requiredCrew: number,
  availableCrew: number
): number {
  if (availableCrew < requiredCrew) {
    return Math.floor(availableCrew) / requiredCrew;
  }

  return 1;
}

export const timeMultiplier = gameDay / gameMonth;

export class ProducingSystem extends System<"exec"> {
  apply = (sim: Sim): void => {
    super.apply(sim);

    this.sim.hooks.removeEntity.subscribe("ProducingSystem", (entity) => {
      if (entity.cp.modules) {
        entity.cp.modules.ids.forEach((id) =>
          this.sim.getOrThrow(id).unregister()
        );
      }
    });

    // Execute every day at the start of the day
    const offset =
      Math.floor(sim.getTime() / gameDay) + 1 - sim.getTime() / gameDay;
    this.cooldowns.use("exec", offset);
    sim.hooks.phase.update.subscribe(this.constructor.name, this.exec);
  };

  static isAbleToProduce = (
    facilityModule: RequireComponent<"production">,
    storage: CommodityStorage,
    outputMultipliers: number[]
    // eslint-disable-next-line no-unused-vars
  ): boolean => {
    if (
      !(
        facilityModule.cooldowns.canUse("production") &&
        facilityModule.cp.production.active &&
        sum(outputMultipliers) > 0
      )
    )
      return false;

    const multiplier = gameDay / gameMonth;
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
      Object.keys(facilityModule.cp.production.pac) as Commodity[]
    );
  };

  static produce = (
    production: Production,
    storage: CommodityStorage,
    outputMultipliers: number[]
  ) => {
    perCommodity((commodity) => {
      if (production.pac[commodity].consumes > 0) {
        const quantity = production.pac[commodity].consumes * timeMultiplier;
        if (production.buffer.consumption[commodity] > quantity) {
          production.buffer.consumption[commodity] -= quantity;
        } else {
          production.buffer.consumption[commodity] +=
            Math.ceil(quantity) - quantity;
          removeStorage(storage, commodity, Math.ceil(quantity));
        }
      }
    });
    perCommodity((commodity) => {
      if (production.pac[commodity].produces > 0) {
        const quantity =
          production.pac[commodity].produces *
          timeMultiplier *
          sum(outputMultipliers);

        production.buffer.production[commodity] += quantity;

        if (production.buffer.production[commodity] >= 1) {
          const dumped = Math.floor(
            Math.max(
              0,
              Math.min(
                storage.quota[commodity] -
                  production.buffer.production[commodity],
                production.buffer.production[commodity]
              )
            )
          );
          production.buffer.production[commodity] -= dumped;

          addStorage(storage, commodity, dumped, false);
        }
      }
    });
  };

  exec = (): void => {
    if (!this.cooldowns.canUse("exec")) return;

    for (const entity of this.sim.index.standaloneProduction.getIt()) {
      const willProduce = ProducingSystem.isAbleToProduce(
        entity,
        entity.cp.storage,
        [1]
      );
      entity.cp.production.produced = willProduce;
      if (!willProduce) {
        continue;
      }

      entity.cooldowns.use("production", gameDay);

      ProducingSystem.produce(entity.cp.production, entity.cp.storage, [1]);
    }

    for (const facilityModule of this.sim.index.productionByModules.getIt()) {
      // It'll be handled by CrewGrowingSystem
      if (facilityModule.tags.has("facilityModuleType:hub")) continue;

      const facility = findInAncestors(
        facilityModule,
        "storage"
      ).requireComponents(["storage", "modules"]);
      const multipliers = [
        ...(facility.hasComponents(["crew"])
          ? [
              getMoodMultiplier(facility.cp.crew.mood),
              getCrewMultiplier(
                getRequiredCrew(facility),
                facility.cp.crew.workers.current
              ),
            ]
          : [1]),
      ];
      const storage = facility.cp.storage;
      const willProduce = ProducingSystem.isAbleToProduce(
        facilityModule,
        storage,
        multipliers
      );
      facilityModule.cp.production.produced = willProduce;
      if (!willProduce) {
        continue;
      }

      facilityModule.cooldowns.use("production", gameDay);
      ProducingSystem.produce(
        facilityModule.cp.production,
        storage,
        multipliers
      );
    }

    this.cooldowns.use("exec", gameDay);
  };
}

export const producingSystem = new ProducingSystem();
