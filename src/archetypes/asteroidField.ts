import { Matrix } from "mathjs";
import { AsteroidSpawn } from "../components/asteroidSpawn";
import { Children } from "../components/children";
import { CoreComponents, Entity } from "../components/entity";
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

export function createAsteroidField(
  sim: Sim,
  type: MineableCommodity,
  size: number,
  position: Matrix
) {
  const entity = new Entity(sim);

  const components: Pick<CoreComponents, AsteroidFieldComponent> = {
    asteroidSpawn: new AsteroidSpawn(type, size),
    children: new Children(),
    position: new Position(position),
  };
  entity.components = components;

  return entity as AsteroidField;
}

export function asteroidField(entity: Entity): AsteroidField {
  if (!entity.hasComponents(asteroidFieldComponents)) {
    throw new MissingComponentError(entity, asteroidFieldComponents);
  }

  return entity as AsteroidField;
}
