import { add, Matrix, matrix, random, randomInt, sum } from "mathjs";
import { asteroid, createAsteroid } from "../archetypes/asteroid";
import { System } from "./system";
import { AsteroidField } from "../archetypes/asteroidField";
import { Sim } from "../sim";
import { Cooldowns } from "../utils/cooldowns";
import { limitMax } from "../utils/limit";

export function getFieldMax(entity: AsteroidField): number {
  return entity.cp.asteroidSpawn.size ** 2 * entity.cp.asteroidSpawn.density;
}

export function getFieldCurrent(entity: AsteroidField): number {
  return sum(
    entity.cp.children.entities
      .map(entity.sim.get)
      .map(asteroid)
      .map((e) => e.cp.minable.resources)
  );
}

export function shouldSpawnAsteroid(entity: AsteroidField): boolean {
  return getFieldCurrent(entity) < getFieldMax(entity);
}

function spawn(field: AsteroidField) {
  const asteroidAngle = Math.random() * Math.PI;

  return createAsteroid(
    window.sim as any,
    field,
    add(
      field.cp.position.coord,
      matrix([
        random(-field.cp.asteroidSpawn.size, field.cp.asteroidSpawn.size) *
          Math.cos(asteroidAngle),
        random(-field.cp.asteroidSpawn.size, field.cp.asteroidSpawn.size) *
          Math.sin(asteroidAngle),
      ])
    ) as Matrix,
    field.cp.position.sector,
    randomInt(
      field.cp.asteroidSpawn.asteroidResources.min,
      field.cp.asteroidSpawn.asteroidResources.max
    )
  );
}

export class AsteroidSpawningSystem extends System {
  cooldowns: Cooldowns<"tick">;

  constructor(sim: Sim) {
    super(sim);
    this.cooldowns = new Cooldowns("tick");
  }

  exec = (delta: number): void => {
    this.cooldowns.update(delta);
    if (!this.cooldowns.canUse("tick")) return;

    this.sim.queries.asteroidFields.get().forEach((entity) => {
      if (this.sim.getTime() < 10) {
        while (shouldSpawnAsteroid(entity)) {
          spawn(entity);
        }
      } else if (shouldSpawnAsteroid(entity)) {
        let toSpawn = limitMax(getFieldMax(entity) * 0.05, getFieldMax(entity));

        while (toSpawn > 0) {
          toSpawn -= spawn(entity).cp.minable.resources;
        }
      }
    });

    this.cooldowns.use("tick", 600);
  };
}
