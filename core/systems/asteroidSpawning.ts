import { gameDay } from "@core/utils/misc";
import { System } from "./system";
import { getFieldMax } from "../archetypes/asteroidField";
import type { Sim } from "../sim";

export class AsteroidSpawningSystem extends System<"exec"> {
  apply = (sim: Sim) => {
    super.apply(sim);

    sim.hooks.phase.update.subscribe(this.constructor.name, this.exec);
  };

  exec = (): void => {
    if (!this.cooldowns.canUse("exec")) return;

    for (const entity of this.sim.queries.asteroidFields.getIt()) {
      if (this.sim.getTime() > 10) {
        entity.cp.asteroidSpawn.amount = Math.min(
          getFieldMax(entity.cp.asteroidSpawn),
          getFieldMax(entity.cp.asteroidSpawn) * 0.05 +
            entity.cp.asteroidSpawn.amount
        );
      }

      this.cooldowns.use("exec", 20 * gameDay);
    }
  };
}

export const asteroidSpawningSystem = new AsteroidSpawningSystem();
