import { DockSize } from "../components/dockable";
import { ShipDriveProps } from "../components/drive";
import { Textures } from "../components/render";
import { Commodity } from "../economy/commodity";
import shipClassesData from "./data/ships.json";

export const shipRoles = ["transport", "mining", "military"] as const;
export type ShipRole = (typeof shipRoles)[number];

export interface ShipBuildInput {
  time: number;
  cost: Partial<Record<Commodity, number>>;
}

export interface ShipInput extends ShipDriveProps {
  build: ShipBuildInput;
  name: string;
  slug: string;
  storage: number;
  mining: number;
  texture: keyof Textures;
  size: DockSize;
  role: ShipRole;
}

export const shipClasses = shipClassesData as ShipInput[];
