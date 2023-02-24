import type { Entity } from "@core/entity";
import type { Sim } from "../sim";
import type { RequireComponent } from "../tsHelpers";
import type { BaseComponent } from "./component";

export interface SelectionManager extends BaseComponent<"selectionManager"> {
  id: number | null;
  /**
   * ID of entity provided by right-clicking
   */
  secondaryId: number | null;
  focused: boolean;
}

export function clearFocus(manager: SelectionManager) {
  manager.focused = false;
  manager.id = null;
  manager.secondaryId = null;
  window.selected = null;
}

export function getSelected(sim: Sim): Entity | undefined {
  return sim.get<Entity>(sim.queries.settings.get()[0].cp.selectionManager.id!);
}

export function getSelectedSecondary(
  sim: Sim
): RequireComponent<"position"> | undefined {
  return sim.get<RequireComponent<"position">>(
    sim.queries.settings.get()[0].cp.selectionManager.secondaryId!
  );
}
