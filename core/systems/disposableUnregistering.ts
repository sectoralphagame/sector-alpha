import type { Sim } from "@core/sim";
import type { RequireComponent } from "@core/tsHelpers";
import { System } from "./system";
import { NavigatingSystem } from "./navigating";

const disposablePool = 300;

export class DisposableUnregisteringSystem extends System<"exec"> {
  apply(sim: Sim) {
    super.apply(sim);

    sim.hooks.phase.cleanup.subscribe(
      this.constructor.name,
      this.exec.bind(this)
    );
    NavigatingSystem.onTargetReached(this.constructor.name, (entity) => {
      if (entity.hasComponents(["disposable"])) {
        DisposableUnregisteringSystem.dispose(entity);
      }
    });
  }

  // eslint-disable-next-line class-methods-use-this
  static dispose(entity: RequireComponent<"disposable">): void {
    entity.cp.disposable.disposed = true;
  }

  exec(delta: number): void {
    this.cooldowns.update(delta);
    if (this.cooldowns.canUse("exec")) {
      this.cooldowns.use("exec", 120);

      let disposables = 0;
      for (const entity of this.sim.index.disposable.getIt()) {
        disposables++;
        const owner = this.sim.get(entity.cp.disposable.owner);
        if (
          entity.cp.disposable.disposed ||
          !owner ||
          !owner.cp.orders?.value.some((order) =>
            order.actions.some(
              (action) =>
                action.type === "move" && action.targetId === entity.id
            )
          )
        ) {
          if (disposables > disposablePool) {
            entity.unregister("disposed");
            disposables--;
          } else {
            DisposableUnregisteringSystem.dispose(entity);
          }
        }
      }
    }
  }
}

export const disposableUnregisteringSystem =
  new DisposableUnregisteringSystem();
