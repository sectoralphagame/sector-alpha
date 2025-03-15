import type { Sim } from "@core/sim";
import { System } from "./system";

export class DisposableUnregisteringSystem extends System<"exec"> {
  apply = (sim: Sim) => {
    super.apply(sim);

    sim.hooks.phase.cleanup.subscribe(this.constructor.name, this.exec);
  };

  exec = (delta: number): void => {
    this.cooldowns.update(delta);
    if (this.cooldowns.canUse("exec")) {
      this.cooldowns.use("exec", 120);

      for (const entity of this.sim.index.disposable.getIt()) {
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
          entity.unregister("disposed");
        }
      }
    }
  };
}

export const disposableUnregisteringSystem =
  new DisposableUnregisteringSystem();
