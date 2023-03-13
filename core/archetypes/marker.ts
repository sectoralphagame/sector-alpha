import type { Matrix } from "mathjs";
import { Entity } from "../entity";
import { MissingComponentError } from "../errors";
import type { Sim } from "../sim";
import type { RequireComponent } from "../tsHelpers";

export const markerComponents = ["position"] as const;

export type MarkerComponent = (typeof markerComponents)[number];
export type Marker = RequireComponent<MarkerComponent>;

export function marker(entity: Entity): Marker {
  if (!entity.hasComponents(markerComponents)) {
    throw new MissingComponentError(entity, markerComponents);
  }

  return entity as Marker;
}

export interface MarkerInput {
  owner: number;
  value: Matrix;
  sector: number;
}

export function createMarker(sim: Sim, { value, sector, owner }: MarkerInput) {
  const entity = new Entity(sim);

  entity
    .addComponent({
      name: "position",
      coord: value,
      angle: 0,
      sector,
      moved: false,
    })
    .addComponent({ name: "disposable", owner });

  return entity as Marker;
}
