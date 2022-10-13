import { Sector } from "@core/archetypes/sector";

export interface ContextMenu {
  active: boolean;
  position: number[];
  worldPosition: number[];
  sector: Sector | null;
}
