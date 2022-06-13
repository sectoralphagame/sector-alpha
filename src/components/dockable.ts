import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import { BaseComponent } from "./component";

export type WithDock = RequireComponent<"position" | "docks">;
export type WithDocking = RequireComponent<"position" | "dockable">;

export type DockSize = "small" | "medium" | "large";

export interface Dockable extends BaseComponent<"dockable"> {
  dockedIn: number | null;
  size: DockSize;
}

export interface Docks extends BaseComponent<"docks"> {
  docked: number[];
  pads: Record<DockSize, number>;
}

export function availableDocks(docks: Docks, size: DockSize, sim: Sim) {
  return (
    docks.pads[size] -
    docks.docked.filter(
      (e) =>
        sim.getOrThrow(e)!.requireComponents(["dockable"]).cp.dockable.size ===
        size
    ).length
  );
}

export function createDocks(pads: Record<DockSize, number>): Docks {
  return {
    name: "docks",
    docked: [],
    pads,
  };
}
