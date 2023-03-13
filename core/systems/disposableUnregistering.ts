import type { Sim } from "@core/sim";
import { Cooldowns } from "@core/utils/cooldowns";
import { System } from "./system";

export class DisposableUnregisteringSystem extends System {
  cooldowns: Cooldowns<"exec">;

  constructor(sim: Sim) {
    super(sim);
    this.cooldowns = new Cooldowns("exec");
  }

  exec = (delta: number): void => {
    this.cooldowns.update(delta);
    if (this.cooldowns.canUse("exec")) {
      this.cooldowns.use("exec", 120);

      this.sim.queries.destroyAfterUsage.get().forEach((entity) => {
        const owner = this.sim.get(entity.cp.destroyAfterUsage.owner)
        if (!owner || !owner.cp.orders?.value.some(order=>order.actions.some(action=>action.type==="move" && action.targetId===entity.id))) {
          entity.unregister();
        }
      });
    }
  };
}
