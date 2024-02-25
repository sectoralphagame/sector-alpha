import { maxMood, minMood } from "@core/components/crew";
import { gameDay, gameMonth } from "@core/utils/misc";
import type { Sim } from "../sim";
import { System } from "./system";

export class CrewGrowingSystem extends System<"exec"> {
  apply = (sim: Sim): void => {
    super.apply(sim);

    this.sim.hooks.removeEntity.tap("CrewGrowingSystem", (entity) => {
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

  exec = (): void => {
    if (!this.cooldowns.canUse("exec")) return;

    for (const facility of this.sim.queries.facilities.getIt()) {
      const facilityModules = facility.cp.modules.ids.map((id) =>
        this.sim.getOrThrow(id)
      );
      const moodBonus = facilityModules.reduce(
        (acc, fm) => acc + (fm.cp.facilityModuleBonus?.mood ?? 0),
        0
      );
      const targetMood = (maxMood - minMood) / 2 + moodBonus;

      for (const facilityModule of facilityModules) {
        if (
          facilityModule.cp.production &&
          facilityModule.cp.facilityModuleBonus?.workers
        ) {
          let moodChange = (maxMood - minMood) / (3 * (gameMonth / gameDay));
          if (facility.cp.crew.mood > targetMood) moodChange *= -1;
          facility.cp.crew.mood = Math.max(
            minMood,
            Math.max(maxMood, facility.cp.crew.mood + moodChange)
          );

          let crewChange = gameMonth / gameDay;
          if (!facilityModule.cp.production.produced) crewChange *= -1;
          facility.cp.crew.workers.current = Math.max(
            0,
            Math.min(
              facility.cp.crew.workers.current + crewChange,
              facility.cp.crew.workers.max + 0.5
            )
          );
        }
      }
    }

    this.cooldowns.use("exec", gameDay);
  };
}
