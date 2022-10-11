import { System } from "./system";

export class CooldownUpdatingSystem extends System {
  exec = (delta: number): void => {
    this.sim.entities.forEach((entity) => entity.cooldowns.update(delta));
  };
}
