import type { Sim } from "@core/sim";
import { entityIndexer } from "@core/entityIndexer/entityIndexer";
import { System } from "./system";

export const regenCooldown = "regen";

export class HitpointsRegeneratingSystem extends System<"exec"> {
  apply = (sim: Sim) => {
    super.apply(sim);

    sim.hooks.phase.update.subscribe(this.constructor.name, this.exec);
  };

  exec = (): void => {
    if (!this.cooldowns.canUse("exec")) return;

    this.cooldowns.use("exec", 1);
    for (const entity of entityIndexer.search(["hitpoints"])) {
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
    }
  };
}

export const hitpointsRegeneratingSystem = new HitpointsRegeneratingSystem();
