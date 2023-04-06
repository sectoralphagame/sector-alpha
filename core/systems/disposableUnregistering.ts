import type { Sim } from "@core/sim";
import { Cooldowns } from "@core/utils/cooldowns";
import { System } from "./system";

export class DisposableUnregisteringSystem extends System {
  cooldowns: Cooldowns<"exec">;

  constructor() {
    super();
    this.cooldowns = new Cooldowns("exec");
  }

  apply = (sim: Sim) => {
    super.apply(sim);

    sim.hooks.phase.cleanup.tap(this.constructor.name, this.exec);
  };

  exec = (delta: number): void => {
    this.cooldowns.update(delta);
    if (this.cooldowns.canUse("exec")) {
      this.cooldowns.use("exec", 120);

      this.sim.queries.disposable.get().forEach((entity) => {
        const owner = this.sim.get(entity.cp.disposable.owner);
        if (
          !owner ||
          !owner.cp.orders?.value.some((order) =>
            order.actions.some(
              (action) =>
                action.type === "move" && action.targetId === entity.id
            )
          )
        ) {
          entity.unregister();
        }
      });
    }
  };
}
