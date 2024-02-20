import { sectorSize } from "@core/archetypes/sector";
import { ship } from "@core/archetypes/ship";
import { hecsToCartesian } from "@core/components/hecsPosition";
import type { Position2D } from "@core/components/position";
import type { Entity } from "@core/entity";
import { isHeadless } from "@core/settings";
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

export const gameHour = 3600000;
export function getGameDate(timeOffset: number): string {
  const date = new Date(
    (timeOffset - 3600) * gameHour + +new Date("2519-01-01T00:00:00Z")
  );

  return `${date.getDate()}.${date.getMonth() + 1}.${date.getUTCFullYear()}`;
}
