import type { Sim } from "@core/sim";
import { System } from "./system";

export class CooldownUpdatingSystem extends System {
  apply = (sim: Sim): void => {
    super.apply(sim);

    sim.hooks.subscribe("phase", ({ phase, delta }) => {
      if (phase === "init") {
        this.exec(delta);
      }
    });
  };
  exec = (delta: number): void => {
    this.sim.entities.forEach((entity) => entity.cooldowns.update(delta));
  };
}

export const cooldownUpdatingSystem = new CooldownUpdatingSystem();
