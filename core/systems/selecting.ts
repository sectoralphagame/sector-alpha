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

  exec = (delta: number): void => {
    super.exec(delta);
    this.hook(
      this.sim.queries.settings.get()[0].cp.selectionManager.id,
      this.refresh
    );
  };
}
