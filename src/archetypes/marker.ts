import { Matrix } from "mathjs";
import { Entity } from "../components/entity";
import { MissingComponentError } from "../errors";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import { Sector } from "./sector";

export const markerComponents = ["position"] as const;

// Ugly hack to transform markerComponents array type to string union
const widenType = [...markerComponents][0];
export type MarkerComponent = typeof widenType;
export type Marker = RequireComponent<MarkerComponent>;

export function marker(entity: Entity): Marker {
  if (!entity.hasComponents(markerComponents)) {
    throw new MissingComponentError(entity, markerComponents);
  }

  return entity as Marker;
}

export interface MarkerInput {
  value: Matrix;
  sector: Sector;
}

export function createMarker(sim: Sim, { value, sector }: MarkerInput) {
  const entity = new Entity(sim);

  entity.addComponent({
    name: "position",
    coord: value,
    angle: 0,
    sector: sector.id,
  });

  return entity as Marker;
}
