import { BaseComponent } from "./component";

export interface Selection extends BaseComponent<"selection"> {}

export interface SelectionManager extends BaseComponent<"selectionManager"> {
  id: number | null;
  focused: boolean;
}

export function clearFocus(manager: SelectionManager) {
  manager.id = null;
  manager.focused = false;
}
