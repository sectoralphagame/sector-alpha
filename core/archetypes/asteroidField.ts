import type { Matrix } from "mathjs";
import { add, matrix, randomInt, random } from "mathjs";
import type { AsteroidSpawn } from "../components/asteroidSpawn";
import { Entity } from "../entity";
import { createRenderGraphics } from "../components/renderGraphics";
import type { Sim } from "../sim";
import type { RequireComponent } from "../tsHelpers";
import type { Sector } from "./sector";
import { createAsteroid } from "./asteroid";

export const asteroidFieldComponents = [
  "asteroidSpawn",
  "children",
  "position",
  "renderGraphics",
] as const;

export type AsteroidFieldComponent = (typeof asteroidFieldComponents)[number];
export type AsteroidField = RequireComponent<AsteroidFieldComponent>;

export function asteroidField(entity: Entity): AsteroidField {
  return entity.requireComponents(asteroidFieldComponents);
}

export function getFieldMax(
  asteroidSpawn: Pick<AsteroidSpawn, "size" | "density">
): number {
  return asteroidSpawn.size ** 2 * asteroidSpawn.density;
}

export function spawn(field: AsteroidField) {
  const sim = field.sim;
  const asteroidAngle = Math.random() * Math.PI;
  const asteroidDistance = random(-1, 1) * field.cp.asteroidSpawn.size;
  const amount = Math.max(
    field.cp.asteroidSpawn.amount,
    randomInt(
      field.cp.asteroidSpawn.asteroidResources.min,
      field.cp.asteroidSpawn.asteroidResources.max
    )
  );

  field.cp.asteroidSpawn.amount -= amount;
  const asteroid = createAsteroid(
    sim,
    field,
    add(
      field.cp.position.coord,
      matrix([
        asteroidDistance * Math.cos(asteroidAngle),
        asteroidDistance * Math.sin(asteroidAngle),
      ])
    ) as Matrix,
    amount
  );
  field.cp.children.entities.push(asteroid.id);

  return asteroid;
}

export function createAsteroidField(
  sim: Sim,
  position: Matrix,
  sector: Sector,
  data: Omit<AsteroidSpawn, "name" | "amount">
) {
  const entity = new Entity(sim);

  entity
    .addComponent({
      name: "asteroidSpawn",
      ...data,
      amount: getFieldMax(data) * random(0.8, 1),
    })
    .addComponent({ name: "children", entities: [] })
    .addComponent({
      name: "position",
      coord: position,
      angle: 0,
      sector: sector.id,
      moved: false,
    })
    .addComponent(createRenderGraphics("asteroidField"));

  return asteroidField(entity);
}
