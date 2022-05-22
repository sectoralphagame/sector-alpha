import { RequireComponent } from "../tsHelpers";
import { BaseComponent } from "./component";
import { EntityId } from "./utils/entityId";

export interface Selection extends BaseComponent<"selection"> {}

export interface SelectionManager
  extends BaseComponent<"selectionManager">,
    EntityId<RequireComponent<"selection">> {
  focused: boolean;
}

export function clearFocus(manager: SelectionManager) {
  manager.entityId = null;
  manager.entity = null;
  manager.focused = false;
}
