import type { Vec2 } from "ogl";
import { sum } from "@fxts/core";
import type { MineableCommodity } from "../economy/commodity";
import type { BaseComponent } from "./component";

export type FPoint = [Vec2, number];

export interface Mineable extends BaseComponent<"mineable"> {
  resources: Record<MineableCommodity, number>;
  density: number;
  size: number;
  // Focal points for setting up asteroids in the field with their radiuses
  fPoints: FPoint[];
  mountPoints: {
    /**
     * List of IDs of entities that are currently using this mineable
     */
    used: number[];
    max: number;
  };
}

export function createMineable(
  resources: Record<MineableCommodity, number>,
  density: number,
  size: number,
  fPoints: FPoint[]
): Mineable {
  if (1 - sum(Object.values(resources)) > 0.001) {
    throw new Error("Resources do not sum up to 1");
  }

  return {
    name: "mineable",
    resources,
    density,
    size,
    fPoints,
    mountPoints: {
      used: [],
      max: Math.floor((size * 2) / 3) + 1,
    },
  };
}
