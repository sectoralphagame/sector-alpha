import { System } from "./system";

export class SelectingSystem extends System {
  exec = (): void => {
    const manager = this.sim.queries.selectionManager.get()[0];
    if (
      manager.cp.selectionManager.id &&
      manager.cp.selectionManager.id !== window.selected?.id
    ) {
      window.selected = this.sim.get(manager.cp.selectionManager.id!);
    }
  };
}
