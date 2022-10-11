import { BaseComponent } from "./component";

export interface Selection extends BaseComponent<"selection"> {}

export interface SelectionManager extends BaseComponent<"selectionManager"> {
  id: number | null;
  focused: boolean;
}

export function clearFocus(manager: SelectionManager) {
  manager.focused = false;
  manager.id = null;
  window.selected = null;
}
