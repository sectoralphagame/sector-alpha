import { Buildable } from "../components/buildable";
import { DockSize } from "../components/dockable";
import { ShipDriveProps } from "../components/drive";
import { Textures } from "../components/render";
import shipClassesData from "./data/ships.json";

export interface ShipInput extends ShipDriveProps {
  build: Omit<Buildable, "name">;
  name: string;
  storage: number;
  mining: number;
  texture: keyof Textures;
  size: DockSize;
}

export const shipClasses = shipClassesData as ShipInput[];
