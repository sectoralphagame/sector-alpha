import { Matrix } from "mathjs";
import Color from "color";
import { MineableCommodity } from "@core/economy/commodity";
import { Entity } from "../components/entity";
import { createRender } from "../components/render";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import { AsteroidField } from "./asteroidField";

export const fieldColors = {
  fuelium: "#ffab6b",
  goldOre: "#ffe46b",
  ice: "#e8ffff",
  ore: "#ff5c7a",
  silica: "#8f8f8f",
} as Record<MineableCommodity, string>;

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
      sector: parent.cp.position.sector,
      moved: false,
    })
    .addComponent(
      createRender({
        color: Color(fieldColors[type]).rgbNumber(),
        defaultScale: 0.6,
        maxZ: 3,
        texture: "asteroid",
        zIndex: 0,
      })
    );

  parent.components.children.entities.push(entity.id);

  return asteroid(entity);
}
