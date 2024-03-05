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
import type { RequireComponent, RequirePureComponent } from "../tsHelpers";
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
  crewableWithModules: RequirePureComponent<"crew">
): number {
  if (crewableWithModules.cp.crew.workers.current < requiredCrew) {
    return crewableWithModules.cp.crew.workers.current / requiredCrew;
  }

  return 1;
}

export const timeMultiplier = gameDay / gameMonth;

export class ProducingSystem extends System<"exec"> {
  apply = (sim: Sim): void => {
    super.apply(sim);

    this.sim.hooks.removeEntity.tap("ProducingSystem", (entity) => {
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
    sim.hooks.phase.update.tap(this.constructor.name, this.exec);
  };

  static isAbleToProduce = (
    facilityModule: RequireComponent<"production">,
    storage: CommodityStorage
    // eslint-disable-next-line no-unused-vars
  ): boolean => {
    if (
      !(
        facilityModule.cooldowns.canUse("production") &&
        facilityModule.cp.production.active
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
        removeStorage(
          storage,
          commodity,
          Math.floor(production.pac[commodity].consumes * timeMultiplier)
        );
      }
    });
    perCommodity((commodity) => {
      if (production.pac[commodity].produces > 0) {
        const quantity =
          production.pac[commodity].produces *
          timeMultiplier *
          sum(outputMultipliers);
        addStorage(
          storage,
          commodity,
          Math.floor(Math.min(storage.quota[commodity] - quantity, quantity)),
          false
        );
      }
    });
  };

  exec = (): void => {
    if (!this.cooldowns.canUse("exec")) return;

    for (const entity of this.sim.queries.standaloneProduction.getIt()) {
      const willProduce = ProducingSystem.isAbleToProduce(
        entity,
        entity.cp.storage
      );
      entity.cp.production.produced = willProduce;
      if (!willProduce) {
        continue;
      }

      entity.cooldowns.use("production", gameDay);

      ProducingSystem.produce(entity.cp.production, entity.cp.storage, [1]);
    }

    for (const facilityModule of this.sim.queries.productionByModules.getIt()) {
      // It'll be handled by CrewGrowingSystem
      if (facilityModule.tags.has("facilityModuleType:hub")) continue;

      const facility = findInAncestors(
        facilityModule,
        "storage"
      ).requireComponents(["storage", "crew", "modules"]);
      const storage = facility.cp.storage;
      const willProduce = ProducingSystem.isAbleToProduce(
        facilityModule,
        storage
      );
      facilityModule.cp.production.produced = willProduce;
      if (!willProduce) {
        continue;
      }

      facilityModule.cooldowns.use("production", gameDay);
      ProducingSystem.produce(facilityModule.cp.production, storage, [
        getMoodMultiplier(facility.cp.crew.mood),
        getCrewMultiplier(getRequiredCrew(facility), facility),
      ]);
    }

    this.cooldowns.use("exec", gameDay);
  };
}
