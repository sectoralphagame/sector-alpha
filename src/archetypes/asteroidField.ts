import { Matrix } from "mathjs";
import { Entity } from "../components/entity";
import { createRenderGraphics } from "../components/renderGraphics";
import { MineableCommodity } from "../economy/commodity";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import { fieldColors } from "./asteroid";
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
  type: MineableCommodity,
  size: number,
  position: Matrix,
  sector: Sector
) {
  const entity = new Entity(sim);

  entity
    .addComponent({
      name: "asteroidSpawn",
      size,
      type,
    })
    .addComponent({ name: "children", entities: [] })
    .addComponent({
      name: "position",
      coord: position,
      angle: 0,
      sector: sector.id,
    })
    .addComponent(
      createRenderGraphics("circle", {
        color: fieldColors[entity.cp.asteroidSpawn!.type],
        position: entity.cp.position!.coord,
        radius: entity.cp.asteroidSpawn!.size,
      })
    );

  return asteroidField(entity);
}
