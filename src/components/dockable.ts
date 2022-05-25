import { RequireComponent } from "../tsHelpers";
import { BaseComponent } from "./component";
import { EntityId, EntityIds } from "./utils/entityId";

export type WithDock = RequireComponent<"position" | "docks">;
export type WithDocking = RequireComponent<"position" | "dockable">;

export type DockSize = "small" | "medium" | "large";

export interface Dockable
  extends BaseComponent<"dockable">,
    EntityId<WithDock> {
  size: DockSize;
}

export interface Docks
  extends BaseComponent<"docks">,
    EntityIds<RequireComponent<"dockable" | "position">> {
  pads: Record<DockSize, number>;
}

export function availableDocks(docks: Docks, size: DockSize) {
  return (
    docks.pads[size] -
    docks.entities.filter((e) => e.cp.dockable.size === size).length
  );
}

export function createDocks(pads: Record<DockSize, number>): Docks {
  return {
    name: "docks",
    entities: [],
    entityIds: [],
    pads,
  };
}
