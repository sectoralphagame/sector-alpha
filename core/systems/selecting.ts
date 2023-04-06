import type { Sim } from "@core/sim";
import { clearFocus } from "../components/selection";
import { isHeadless } from "../settings";
import { SystemWithHooks } from "./utils/hooks";

export class SelectingSystem extends SystemWithHooks {
  refresh = () => {
    if (isHeadless) {
      return;
    }
    const manager = this.sim.queries.settings.get()[0];

    if (manager.cp.selectionManager.id) {
      window.selected = this.sim.getOrThrow(manager.cp.selectionManager.id!);
    } else {
      clearFocus(manager.cp.selectionManager);
    }
  };

  apply = (sim: Sim): void => {
    super.apply(sim);
    sim.hooks.phase.update.tap(this.constructor.name, this.exec);
  };

  exec = (delta: number): void => {
    super.exec(delta);
    this.hook(
      this.sim.queries.settings.get()[0].cp.selectionManager.id,
      this.refresh
    );
  };
}
