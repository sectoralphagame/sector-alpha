import type { Sim } from "@core/sim";
import { System } from "./system";

export class CooldownUpdatingSystem extends System {
  apply = (sim: Sim): void => {
    super.apply(sim);

    sim.hooks.phase.init.subscribe(this.constructor.name, this.exec);
  };
  exec = (delta: number): void => {
    this.sim.entities.forEach((entity) => entity.cooldowns.update(delta));
  };
}
