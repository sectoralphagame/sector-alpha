import Color from "color";
import { Matrix } from "mathjs";
import { Entity } from "../components/entity";
import { RenderGraphics } from "../components/render";
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
    .addComponent({ name: "children", entities: [], entityIds: [] })
    .addComponent({
      name: "position",
      coord: position,
      angle: 0,
      entity: sector,
      entityId: sector.id,
    })
    .addComponent(
      new RenderGraphics((g) => {
        g.lineStyle({
          alpha: 0.3,
          width: 1,
          color: Color(fieldColors[entity.cp.asteroidSpawn!.type]).rgbNumber(),
        });
        g.drawCircle(
          entity.cp.position!.coord.get([0]) * 10,
          entity.cp.position!.coord.get([1]) * 10,
          entity.cp.asteroidSpawn!.size * 10
        );
      })
    );

  return asteroidField(entity);
}
