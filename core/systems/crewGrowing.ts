import { maxMood, minMood } from "@core/components/crew";
import { recalculateCompoundProduction } from "@core/utils/entityModules";
import { gameDay, gameMonth } from "@core/utils/misc";
import { filter, find, groupBy, map, pipe, some } from "@fxts/core";
import { facilityModules } from "@core/archetypes/facilityModule";
import type { RequireComponent } from "@core/tsHelpers";
import { getRequiredCrew } from "@core/utils/crew";
import type { Sim } from "../sim";
import { System } from "./system";
import { ProducingSystem, timeMultiplier } from "./producing";

function getHubModule(facility: RequireComponent<"modules">) {
  return pipe(
    facility.cp.modules.ids,
    map(facility.sim.getOrThrow),
    find((fm) => fm.tags.has("facilityModuleType:hub"))
  )?.requireComponents(["name", "parent", "production"])!;
}

export class CrewGrowingSystem extends System<"exec"> {
  apply = (sim: Sim): void => {
    super.apply(sim);

    // Execute every day at the start of the day
    const offset =
      Math.floor(sim.getTime() / gameDay) + 1 - sim.getTime() / gameDay;
    this.cooldowns.use("exec", offset);
    sim.hooks.phase.update.tap(this.constructor.name, this.exec);
  };

  exec = (): void => {
    if (!this.cooldowns.canUse("exec")) return;

    const facilities = this.sim.queries.facilities.get();
    const sectorHubs = pipe(
      this.sim.queries.facilities.getIt(),
      filter((facility) =>
        some(
          (facilityModuleId) =>
            this.sim
              .getOrThrow(facilityModuleId)
              .tags.has("facilityModuleType:hub"),
          facility.cp.modules.ids
        )
      ),
      groupBy((facility) => facility.cp.position.sector)
    );

    const hubModuleTemplate = facilityModules.hub;
    if (hubModuleTemplate.type !== "hub") {
      throw new Error(
        `Expected FacilityModule of type hub, got: ${hubModuleTemplate.type}`
      );
    }

    for (const hub of Object.values(sectorHubs).flat()) {
      const hubModule = getHubModule(hub);
      // eslint-disable-next-line guard-for-in
      for (const commodity in hubModuleTemplate.pac) {
        hubModule!.cp.production!.pac[commodity].consumes =
          hubModuleTemplate.pac[commodity].consumes;
      }
    }

    for (const facility of facilities) {
      const hub = sectorHubs[facility.cp.position.sector]?.find(
        (hubFacility) => hubFacility.cp.owner?.id === facility.cp.owner?.id
      );
      if (!hub) continue;

      const hubModule = getHubModule(hub);

      // eslint-disable-next-line guard-for-in
      for (const commodity in hubModuleTemplate.pac) {
        hubModule!.cp.production!.pac[commodity].consumes +=
          hubModuleTemplate.pac[commodity].consumes *
          Math.floor(facility.cp.crew.workers.current);
      }
    }

    for (const hub of Object.values(sectorHubs).flat()) {
      recalculateCompoundProduction(
        hub.requireComponents(["compoundProduction", "modules"])
      );

      const hubModule = getHubModule(hub);
      if (ProducingSystem.isAbleToProduce(hubModule!, hub.cp.storage!, [1])) {
        ProducingSystem.produce(hubModule!.cp.production, hub.cp.storage!, [
          timeMultiplier,
        ]);
        hubModule.cp.production.produced = true;
      } else {
        hubModule.cp.production.produced = false;
      }
    }

    for (const facility of facilities) {
      const hub = sectorHubs[facility.cp.position.sector]?.find(
        (hubFacility) => hubFacility.cp.owner?.id === facility.cp.owner?.id
      );
      const fModules = facility.cp.modules.ids.map((id) =>
        this.sim.getOrThrow(id)
      );
      const moodBonus = fModules.reduce(
        (acc, fm) => acc + (fm.cp.facilityModuleBonus?.mood ?? 0),
        0
      );
      const targetMood = (maxMood - minMood) / 2 + moodBonus;

      let ok = false;

      if (hub) {
        ok = getHubModule(hub).cp.production.produced;
      }

      let moodChange = (maxMood - minMood) / (3 * (gameMonth / gameDay));
      if (facility.cp.crew.mood > targetMood || (!ok && moodChange > 0)) {
        moodChange *= -1;
      }
      facility.cp.crew.mood = Math.max(
        minMood,
        Math.min(maxMood, facility.cp.crew.mood + moodChange)
      );

      let crewChange = gameDay / gameMonth;
      if (!ok && crewChange > 0) {
        crewChange *= -1;
      }
      facility.cp.crew.workers.current = Math.max(
        0,
        Math.min(
          facility.cp.crew.workers.current + crewChange,
          facility.cp.crew.workers.max + 0.5,
          getRequiredCrew(facility) + 0.5
        )
      );
    }

    this.cooldowns.use("exec", gameDay);
  };
}
