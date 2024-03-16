import { sectorSize } from "@core/archetypes/sector";
import { ship } from "@core/archetypes/ship";
import { hecsToCartesian } from "@core/components/hecsPosition";
import type { Position2D } from "@core/components/position";
import type { Entity } from "@core/entity";
import settings, { isHeadless } from "@core/settings";
import type { RequireComponent } from "@core/tsHelpers";
import { first } from "@fxts/core";
import { add, norm, random, subtract } from "mathjs";

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

export function setCheat(key: string, fn: Function) {
  if (!isHeadless) {
    if (!window.cheats) {
      window.cheats = {};
    }

    window.cheats[key] = fn;
  }
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
  } while (
    norm(
      subtract(
        hecsToCartesian(
          entity.sim.getOrThrow(entity.cp.position.sector).cp.hecsPosition!
            .value,
          sectorSize / 10
        ),
        position
      ) as Position2D
    ) > sectorSize
  );

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
