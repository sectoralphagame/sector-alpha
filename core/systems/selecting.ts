import type { Sim } from "@core/sim";
import type { RequireComponent } from "@core/tsHelpers";
import { first } from "@fxts/core";
import { Observable } from "@core/utils/observer";
import { clearFocus } from "../components/selection";
import { isHeadless } from "../settings";
import { SystemWithHooks } from "./utils/hooks";

export class SelectingSystem extends SystemWithHooks {
  hook: Observable<[number | null, number | null]> = new Observable(
    "SelectingSystem"
  );
  manager: RequireComponent<"selectionManager">;

  constructor() {
    super();

    this.hook = new Observable("SelectingSystem");
  }

  refresh = (prevId: number | null) => {
    if (isHeadless) {
      return;
    }

    this.hook.notify([prevId, this.manager.cp.selectionManager.id!]);

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
    this.manager = first(this.sim.index.settings.getIt())!;
    this.onChange(this.manager.cp.selectionManager.id, this.refresh);
  };
}

export const selectingSystem = new SelectingSystem();
