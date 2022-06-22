import { clearFocus } from "../components/selection";
import { System } from "./system";

export class SelectingSystem extends System {
  exec = (): void => {
    const manager = this.sim.queries.selectionManager.get()[0];
    if (
      manager.cp.selectionManager.id &&
      manager.cp.selectionManager.id !== window.selected?.id
    ) {
      window.selected = this.sim.getOrThrow(manager.cp.selectionManager.id!);
    } else if (manager.cp.selectionManager.id === null) {
      clearFocus(manager.cp.selectionManager);
      window.selected = null;
    }
  };
}
