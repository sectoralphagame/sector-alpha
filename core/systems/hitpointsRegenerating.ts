import type { Sim } from "@core/sim";
import { Cooldowns } from "@core/utils/cooldowns";
import { Query } from "./utils/query";
import { System } from "./system";

export const regenCooldown = "regen";

export class HitpointsRegeneratingSystem extends System {
  cooldowns: Cooldowns<"exec">;
  query: Query<"hitpoints">;

  constructor(sim: Sim) {
    super(sim);
    this.cooldowns = new Cooldowns("exec");
    this.query = new Query(sim, ["hitpoints"]);
  }

  exec = (delta: number): void => {
    this.cooldowns.update(delta);
    if (!this.cooldowns.canUse("exec")) return;

    this.cooldowns.use("exec", 1);
    this.query.get().forEach((entity) => {
      if (!entity.cooldowns.canUse(regenCooldown)) return;
      entity.cp.hitpoints.hp.value = Math.min(
        entity.cp.hitpoints.hp.value + entity.cp.hitpoints.hp.regen,
        entity.cp.hitpoints.hp.max
      );

      if (entity.cp.hitpoints.shield) {
        entity.cp.hitpoints.shield.value = Math.min(
          entity.cp.hitpoints.shield.value + entity.cp.hitpoints.shield.regen,
          entity.cp.hitpoints.shield.max
        );
      }

      entity.cp.hitpoints.hit = true;
    });
  };
}
