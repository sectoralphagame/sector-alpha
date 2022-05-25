import { System } from "./system";

export class SelectingSystem extends System {
  exec = (): void => {
    const manager = this.sim.queries.selectionManager.get()[0];
    if (manager.cp.selectionManager.entityId !== window.selected?.id) {
      window.selected = manager.cp.selectionManager.entity;
    }
  };
}
