import { Matrix } from "mathjs";
import Color from "color";
import { Entity } from "../components/entity";
import { createRender } from "../components/render";
import { MineableCommodity } from "../economy/commodity";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import { AsteroidField } from "./asteroidField";
import { Sector } from "./sector";

export const asteroidComponents = [
  "minable",
  "parent",
  "position",
  "render",
] as const;

// Ugly hack to transform asteroidComponents array type to string union
const widenType = [...asteroidComponents][0];
export type AsteroidComponent = typeof widenType;
export type Asteroid = RequireComponent<AsteroidComponent>;

export const fieldColors: Record<MineableCommodity, string> = {
  fuelium: "#ffab6b",
  goldOre: "#ffe46b",
  ice: "#e8ffff",
  ore: "#ff5c7a",
  silica: "#8f8f8f",
};

export function asteroid(entity: Entity): Asteroid {
  return entity.requireComponents(asteroidComponents);
}

export function createAsteroid(
  sim: Sim,
  parent: AsteroidField,
  position: Matrix,
  sector: Sector
) {
  const entity = new Entity(sim);
  const type = parent.cp.asteroidSpawn.type;

  entity
    .addComponent({
      name: "minable",
      commodity: type,
      minedById: null,
    })
    .addComponent({
      name: "parent",
      id: parent.id,
    })
    .addComponent({
      name: "position",
      coord: position,
      angle: 0,
      sector: sector.id,
    })
    .addComponent(
      createRender({
        color: Color(fieldColors[type]).rgbNumber(),
        defaultScale: 0.6,
        maxZ: 1.2,
        texture: "asteroid",
        zIndex: 0,
      })
    );

  parent.components.children.entities.push(entity.id);

  return asteroid(entity);
}
