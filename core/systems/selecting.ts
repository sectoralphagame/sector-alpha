import type { Sim } from "@core/sim";
import type { RequireComponent } from "@core/tsHelpers";
import { first } from "@fxts/core";
import { clearFocus } from "../components/selection";
import { isHeadless } from "../settings";
import { SystemWithHooks } from "./utils/hooks";

export class SelectingSystem extends SystemWithHooks {
  manager: RequireComponent<"selectionManager">;

  refresh = () => {
    if (isHeadless) {
      return;
    }

    const selected = this.sim.get(this.manager.cp.selectionManager.id!);

    if (this.manager.cp.selectionManager.id && selected) {
      window.selected = selected;
    } else {
      clearFocus(this.manager.cp.selectionManager);
    }
  };

  apply = (sim: Sim): void => {
    super.apply(sim);

    sim.hooks.phase.update.subscribe("SelectingSystem", this.exec);
  };

  exec = (delta: number): void => {
    super.exec(delta);
    this.manager = first(this.sim.queries.settings.getIt())!;
    this.onChange(this.manager.cp.selectionManager.id, this.refresh);
  };
}

export const selectingSystem = new SelectingSystem();
