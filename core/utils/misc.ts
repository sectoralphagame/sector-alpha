import { sectorSize } from "@core/archetypes/sector";
import { ship } from "@core/archetypes/ship";
import type { Position2D } from "@core/components/position";
import type { Entity } from "@core/entity";
import settings from "@core/settings";
import type { RequireComponent } from "@core/tsHelpers";
import { first } from "@fxts/core";
import { add, norm, random } from "mathjs";

export function isOwnedByPlayer(entity: Entity): boolean {
  return entity!.cp.owner?.id === first(entity.sim.index.player.getIt())!.id;
}

export function getSubordinates(entity: RequireComponent<"subordinates">) {
  return entity.cp.subordinates.ids.map((id) =>
    ship(entity.sim.getOrThrow(id))
  );
}

export function getAngleDiff(
  origin: RequireComponent<"position">,
  target: RequireComponent<"position">
): number {
  const path = [
    target.cp.position.coord[0] - origin.cp.position.coord[0],
    target.cp.position.coord[1] - origin.cp.position.coord[1],
  ];
  const pathAngle = Math.atan2(path[1], path[0]);
  const dAngle = pathAngle - origin.cp.position.angle;

  return Math.atan2(Math.sin(dAngle), Math.cos(dAngle));
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
