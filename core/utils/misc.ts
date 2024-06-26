import { sectorSize } from "@core/archetypes/sector";
import { ship } from "@core/archetypes/ship";
import type { Position2D } from "@core/components/position";
import type { Entity } from "@core/entity";
import settings from "@core/settings";
import type { RequireComponent } from "@core/tsHelpers";
import { first } from "@fxts/core";
import { add, norm, random } from "mathjs";

export function isOwnedByPlayer(entity: Entity): boolean {
  return entity!.cp.owner?.id === first(entity.sim.queries.player.getIt())!.id;
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

export function getRandomPositionInBounds(
  entity: RequireComponent<"position">,
  distance = 2
): Position2D {
  let position: Position2D;

  do {
    position = add(entity.cp.position.coord, [
      random(-distance, distance),
      random(-distance, distance),
    ]);
  } while ((norm(position) as number) > sectorSize);

  return position;
}

export const gameHour = 1;
export const gameDay = gameHour * 24;
export const gameMonth = gameDay * 30;
export const gameYear = gameMonth * 12;
export function getGameDate(timeOffset: number): string {
  const actual = timeOffset - settings.bootTime;
  return `${1 + (Math.floor(actual / gameDay) % 30)}.${
    1 + (Math.floor(actual / gameMonth) % 12)
  }.${2519 + (Math.floor(actual / gameYear) % 12)}`;
}

export function fromPolar(angle: number, distance: number): Position2D {
  return [distance * Math.cos(angle), distance * Math.sin(angle)];
}
