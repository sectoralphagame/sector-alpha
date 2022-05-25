import { Matrix } from "mathjs";
import Color from "color";
import { Entity } from "../components/entity";
import { Render } from "../components/render";
import { MineableCommodity } from "../economy/commodity";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import asteroidTexture from "../../assets/asteroid.svg";
import { AsteroidField } from "./asteroidField";
import { Sector } from "./sector";
import { addEntity } from "../components/utils/entityId";

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
      entity: null,
      entityId: null,
    })
    .addComponent({
      name: "parent",
      entity: parent,
      entityId: parent.id,
    })
    .addComponent({
      name: "position",
      coord: position,
      angle: 0,
      entity: sector,
      entityId: sector.id,
    })
    .addComponent(
      new Render({
        color: Color(fieldColors[type]).rgbNumber(),
        defaultScale: 0.6,
        maxZ: 1.2,
        pathToTexture: asteroidTexture,
        zIndex: 0,
      })
    );

  addEntity(parent.components.children, entity as RequireComponent<"parent">);

  return asteroid(entity);
}
