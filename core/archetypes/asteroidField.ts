import type { Matrix } from "mathjs";
import type { AsteroidSpawn } from "../components/asteroidSpawn";
import { Entity } from "../components/entity";
import { createRenderGraphics } from "../components/renderGraphics";
import type { Sim } from "../sim";
import type { RequireComponent } from "../tsHelpers";
import type { Sector } from "./sector";

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

export function createAsteroidField(
  sim: Sim,
  position: Matrix,
  sector: Sector,
  spawn: Omit<AsteroidSpawn, "name">
) {
  const entity = new Entity(sim);

  entity
    .addComponent({
      name: "asteroidSpawn",
      ...spawn,
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
