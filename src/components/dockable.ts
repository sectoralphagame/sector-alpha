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
  size: DockSize;
  pads: number;
  docked: RequireComponent<"dockable" | "position">[] = [];

  constructor(size: DockSize, pads: number) {
    this.size = size;
    this.pads = pads;
  }
}
