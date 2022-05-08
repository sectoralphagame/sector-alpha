import { Matrix } from "mathjs";
import { CoreComponents, Entity } from "../components/entity";
import { Position } from "../components/position";
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

  const components: Pick<CoreComponents, MarkerComponent> = {
    position: new Position(value, 0, sector),
  };
  entity.components = components;

  return entity as Marker;
}
