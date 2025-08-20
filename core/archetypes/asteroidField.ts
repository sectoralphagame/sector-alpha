import { Vec2 } from "ogl";
import {
  type FPoint,
  createMineable,
  type Mineable,
} from "@core/components/mineable";
import { random, randomInt } from "mathjs";
import { fromPolar } from "@core/utils/misc";
import type { MineableCommodity } from "@core/economy/commodity";
import { Entity } from "../entity";
import type { Sim } from "../sim";
import type { RequireComponent } from "../tsHelpers";
import type { Sector } from "./sector";

export const fieldColors = {
  fuelium: "#873dff",
  goldOre: "#ffe46b",
  ice: "#58f1ff",
  ore: "#ff5c7a",
  silica: "#ededed",
} as Record<MineableCommodity, string>;

export const asteroidFieldComponents = ["mineable", "position"] as const;

export type AsteroidFieldComponent = (typeof asteroidFieldComponents)[number];
export type AsteroidField = RequireComponent<AsteroidFieldComponent>;

export function asteroidField(entity: Entity): AsteroidField {
  return entity.requireComponents(asteroidFieldComponents);
}

export function getRandomPositionInField(field: AsteroidField): Vec2 {
  const { fPoints } = field.cp.mineable;
  const randomIndex = randomInt(0, fPoints.length);
  const [p, r] = fPoints[randomIndex];
  const angle = random(0, 2 * Math.PI);
  const distance = random(0, r);

  return fromPolar(angle, distance).add(p);
}

function getFPoint(last: FPoint[], size: number): FPoint {
  const angle =
    Math.atan2(last[1][0].y - last[0][0].y, last[1][0].x - last[0][0].x) +
    (random(-1, 1) * Math.PI) / 2;
  const distance = (last[1][1] + size) * random(0.7, 0.9);

  return [fromPolar(angle, distance).add(last[1]![0]), size];
}

export function getFPoints(size: number): FPoint[] {
  const fPoints: FPoint[] = [];

  let area = 0;
  const maxArea = size ** 2 * Math.PI;
  while (area < maxArea * Math.PI) {
    if (fPoints.length === 0) {
      fPoints.push([new Vec2(0, 0), random(2, size)]);
      area += fPoints[0][1] ** 2 * Math.PI;
      continue;
    }

    if (fPoints.length === 1) {
      const angle = random(0, 2 * Math.PI);
      const r = random(1, Math.sqrt(maxArea - area));
      const distance = fPoints[0][1] + r;
      fPoints.push([fromPolar(angle, distance), r]);
      area += r ** 2 * Math.PI;
      continue;
    }

    const r = Math.max(1, random(1, Math.sqrt(maxArea - area)));
    area += r ** 2 * Math.PI;

    fPoints.push(getFPoint([fPoints.at(-2)!, fPoints.at(-1)!], size));
  }

  const medianPoint = new Vec2();

  let accW = 0;
  for (const [p, w] of fPoints) {
    medianPoint.add(p.clone().multiply(w));
    accW += w;
  }
  medianPoint.divide(accW);
  for (const [p] of fPoints) {
    p.sub(medianPoint);
  }

  return fPoints;
}

export function createAsteroidField(
  sim: Sim,
  position: Vec2,
  sector: Sector,
  data: Omit<Mineable, "name" | "fPoints" | "mountPoints">
) {
  const entity = new Entity(sim);

  entity
    .addComponent(
      createMineable(
        data.resources,
        data.density,
        data.size,
        getFPoints(data.size)
      )
    )
    .addComponent({
      name: "position",
      coord: position,
      angle: 0,
      sector: sector.id,
      moved: false,
    });

  return asteroidField(entity);
}
