import throttle from "lodash/throttle";
import { clearFocus } from "../components/selection";
import { isHeadless } from "../settings";
import { SystemWithHooks } from "./hooks";

export class SelectingSystem extends SystemWithHooks {
  refresh = () =>
    throttle(() => {
      if (isHeadless) {
        return;
      }
      const manager = this.sim.queries.settings.get()[0];

      if (manager.cp.selectionManager.id) {
        window.selected = this.sim.getOrThrow(manager.cp.selectionManager.id!);
      } else {
        clearFocus(manager.cp.selectionManager);
      }
    }, 500);

  exec = (): void => {
    this.hook(
      this.sim.queries.settings.get()[0].cp.selectionManager.id,
      this.refresh
    );
  };
}
