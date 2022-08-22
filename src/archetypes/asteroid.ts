import { Matrix } from "mathjs";
import Color from "color";
import { Entity } from "../components/entity";
import { createRender } from "../components/render";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import { AsteroidField } from "./asteroidField";
import { theme } from "../style";

export const asteroidComponents = [
  "minable",
  "parent",
  "position",
  "render",
] as const;

export type AsteroidComponent = typeof asteroidComponents[number];
export type Asteroid = RequireComponent<AsteroidComponent>;

export function asteroid(entity: Entity): Asteroid {
  return entity.requireComponents(asteroidComponents);
}

export function createAsteroid(
  sim: Sim,
  parent: AsteroidField,
  position: Matrix,
  sectorId: number,
  resources: number
) {
  const entity = new Entity(sim);
  const type = parent.cp.asteroidSpawn.type;

  entity
    .addComponent({
      name: "minable",
      commodity: type,
      minedById: null,
      resources,
    })
    .addComponent({
      name: "parent",
      id: parent.id,
    })
    .addComponent({
      name: "position",
      coord: position,
      angle: 0,
      sector: sectorId,
    })
    .addComponent(
      createRender({
        color: Color(theme.palette.asteroids[type]).rgbNumber(),
        defaultScale: 0.6,
        maxZ: 3,
        texture: "asteroid",
        zIndex: 0,
      })
    );

  parent.components.children.entities.push(entity.id);

  return asteroid(entity);
}
