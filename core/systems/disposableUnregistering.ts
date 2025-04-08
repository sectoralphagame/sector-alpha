import type { Sim } from "@core/sim";
import { entityIndexer } from "@core/entityIndexer/entityIndexer";
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

      for (const entity of entityIndexer.search(["disposable"])) {
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
          entity.cp.disposable.disposed = true;
        }
      }
    }
  };
}

export const disposableUnregisteringSystem =
  new DisposableUnregisteringSystem();
