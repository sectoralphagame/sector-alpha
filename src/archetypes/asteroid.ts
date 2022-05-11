import { Matrix } from "mathjs";
import { Entity } from "../components/entity";
import { Minable } from "../components/minable";
import { Parent } from "../components/parent";
import { Position } from "../components/position";
import { Render } from "../components/render";
import { MineableCommodity } from "../economy/commodity";
import { MissingComponentError } from "../errors";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";

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

const fieldColors: Record<MineableCommodity, string> = {
  fuelium: "#ffab6b",
  gold: "#ffe46b",
  ice: "#e8ffff",
  ore: "#ff5c7a",
};

export function asteroid(entity: Entity): Asteroid {
  if (!entity.hasComponents(asteroidComponents)) {
    throw new MissingComponentError(entity, asteroidComponents);
  }

  return entity as Asteroid;
}

export function createAsteroid(
  sim: Sim,
  parent: RequireComponent<"asteroidSpawn">,
  position: Matrix
) {
  const entity = new Entity(sim);
  const type = parent.cp.asteroidSpawn.type;

  entity.addComponent("minable", new Minable(type));
  entity.addComponent("parent", new Parent(parent));
  entity.addComponent("position", new Position(position));
  entity.addComponent("render", new Render(0.2, 1.5, fieldColors[type]));

  parent.components.children.add(entity as RequireComponent<"parent">);

  return asteroid(entity);
}
