import { RequireComponent } from "../tsHelpers";

export type WithDock = RequireComponent<"position" | "docks">;
export type WithDocking = RequireComponent<"position" | "dockable">;

export type DockSize = "small" | "medium" | "large";

export class Dockable {
  docked: WithDock | null = null;
  size: DockSize;

  constructor(size: DockSize) {
    this.size = size;
  }
}

export class Docks {
  pads: Record<DockSize, number>;
  docked: RequireComponent<"dockable" | "position">[] = [];

  constructor(pads: Record<DockSize, number>) {
    this.pads = pads;
  }

  available = (size: DockSize) =>
    this.pads[size] -
    this.docked.filter((e) => e.cp.dockable.size === size).length;
}
