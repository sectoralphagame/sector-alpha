import type { Sim } from "@core/sim";
import { Index } from "./utils/entityIndex";
import { System } from "./system";

export const regenCooldown = "regen";

export class HitpointsRegeneratingSystem extends System<"exec"> {
  index: Index<"hitpoints">;

  apply = (sim: Sim) => {
    super.apply(sim);

    this.index = new Index(sim, ["hitpoints"]);

    sim.hooks.phase.update.subscribe(this.constructor.name, this.exec);
  };

  exec = (): void => {
    if (!this.cooldowns.canUse("exec")) return;

    this.cooldowns.use("exec", 1);
    for (const entity of this.index.getIt()) {
      if (!entity.cooldowns.canUse(regenCooldown)) continue;
      entity.cp.hitpoints.hp.value = Math.min(
        entity.cp.hitpoints.hp.value +
          entity.cp.hitpoints.hp.regen * (entity.cp.dockable?.dockedIn ? 4 : 1),
        entity.cp.hitpoints.hp.max
      );

      if (entity.cp.hitpoints.shield) {
        entity.cp.hitpoints.shield.value = Math.min(
          entity.cp.hitpoints.shield.value + entity.cp.hitpoints.shield.regen,
          entity.cp.hitpoints.shield.max
        );
      }

      entity.cp.hitpoints.hit = true;
    }
  };
}

export const hitpointsRegeneratingSystem = new HitpointsRegeneratingSystem();
