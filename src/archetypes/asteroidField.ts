import { Matrix } from "mathjs";
import { AsteroidSpawn } from "../components/asteroidSpawn";
import { Entity } from "../components/entity";
import { createRenderGraphics } from "../components/renderGraphics";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import { Sector } from "./sector";

export const asteroidFieldComponents = [
  "asteroidSpawn",
  "children",
  "position",
  "renderGraphics",
] as const;

// Ugly hack to transform asteroidFieldComponents array type to string union
const widenType = [...asteroidFieldComponents][0];
export type AsteroidFieldComponent = typeof widenType;
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
    })
    .addComponent(createRenderGraphics("asteroidField"));

  return asteroidField(entity);
}
