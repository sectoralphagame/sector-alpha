import type { BaseComponent } from "./component";

export interface SelectionManager extends BaseComponent<"selectionManager"> {
  /**
   * ID of selected entity. Used to restore selection after game load.
   */
  id: number | null;
}
