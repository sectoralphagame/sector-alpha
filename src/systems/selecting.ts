import { System } from "./system";

export class SelectingSystem extends System {
  query = () =>
    this.sim.entities.find((e) => e.hasComponents(["selectionManager"]));

  exec = (): void => {
    const manager = this.query();
    if (manager.cp.selectionManager.id !== window.selected?.id) {
      window.selected = manager.cp.selectionManager.entity;
    }
  };
}
