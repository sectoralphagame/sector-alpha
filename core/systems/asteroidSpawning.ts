import type { Matrix } from "mathjs";
import { add, matrix, random, randomInt, sum } from "mathjs";
import { asteroid, createAsteroid } from "../archetypes/asteroid";
import { System } from "./system";
import type { AsteroidField } from "../archetypes/asteroidField";
import type { Sim } from "../sim";
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

function spawn(field: AsteroidField, sim: Sim) {
  const asteroidAngle = Math.random() * Math.PI;
  const asteroidDistance = random(-1, 1) * field.cp.asteroidSpawn.size;

  return createAsteroid(
    sim,
    field,
    add(
      field.cp.position.coord,
      matrix([
        asteroidDistance * Math.cos(asteroidAngle),
        asteroidDistance * Math.sin(asteroidAngle),
      ])
    ) as Matrix,
    randomInt(
      field.cp.asteroidSpawn.asteroidResources.min,
      field.cp.asteroidSpawn.asteroidResources.max
    )
  );
}

export class AsteroidSpawningSystem extends System {
  cooldowns: Cooldowns<"tick">;

  constructor() {
    super();
    this.cooldowns = new Cooldowns("tick");
  }

  apply = (sim: Sim) => {
    super.apply(sim);

    sim.hooks.phase.update.tap(this.constructor.name, this.exec);
  };

  exec = (delta: number): void => {
    this.cooldowns.update(delta);
    if (!this.cooldowns.canUse("tick")) return;

    this.sim.queries.asteroidFields.get().forEach((entity) => {
      if (this.sim.getTime() < 10) {
        while (shouldSpawnAsteroid(entity)) {
          spawn(entity, this.sim);
        }
      } else if (shouldSpawnAsteroid(entity)) {
        let toSpawn = limitMax(getFieldMax(entity) * 0.05, getFieldMax(entity));

        while (toSpawn > 0) {
          toSpawn -= spawn(entity, this.sim).cp.minable.resources;
        }
      }
    });

    this.cooldowns.use("tick", 600);
  };
}
