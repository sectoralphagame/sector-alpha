import { ship } from "@core/archetypes/ship";
import type { Entity } from "@core/entity";
import type { RequireComponent } from "@core/tsHelpers";

export function isOwnedByPlayer(entity: Entity): boolean {
  return entity!.cp.owner?.id === entity.sim.queries.player.get()[0].id;
}

export function getSubordinates(entity: RequireComponent<"subordinates">) {
  return entity.cp.subordinates.ids.map((id) =>
    ship(entity.sim.getOrThrow(id))
  );
}

// eslint-disable-next-line no-underscore-dangle
function _normalizeAngle(value: number, start: number, end: number): number {
  const width = end - start;
  const offsetValue = value - start;

  return offsetValue - Math.floor(offsetValue / width) * width + start;
}
export function normalizeAngle(value: number): number {
  return _normalizeAngle(value, -Math.PI, Math.PI);
}
