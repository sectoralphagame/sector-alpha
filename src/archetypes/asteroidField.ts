import { Matrix } from "mathjs";
import { AsteroidSpawn } from "../components/asteroidSpawn";
import { Children } from "../components/children";
import { Entity } from "../components/entity";
import { Position } from "../components/position";
import { MineableCommodity } from "../economy/commodity";
import { MissingComponentError } from "../errors";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";

export const asteroidFieldComponents = [
  "asteroidSpawn",
  "children",
  "position",
] as const;

// Ugly hack to transform asteroidFieldComponents array type to string union
const widenType = [...asteroidFieldComponents][0];
export type AsteroidFieldComponent = typeof widenType;
export type AsteroidField = RequireComponent<AsteroidFieldComponent>;

export function asteroidField(entity: Entity): AsteroidField {
  if (!entity.hasComponents(asteroidFieldComponents)) {
    throw new MissingComponentError(entity, asteroidFieldComponents);
  }

  return entity as AsteroidField;
}

export function createAsteroidField(
  sim: Sim,
  type: MineableCommodity,
  size: number,
  position: Matrix
) {
  const entity = new Entity(sim);

  entity.addComponent("asteroidSpawn", new AsteroidSpawn(type, size));
  entity.addComponent("children", new Children());
  entity.addComponent("position", new Position(position));

  return asteroidField(entity);
}
