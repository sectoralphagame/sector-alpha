import { entityIndexer } from "@core/entityIndexer/entityIndexer";
import type { Sim } from "../sim";
import type { RequireComponent } from "../tsHelpers";
import { System } from "./system";

const maxSpeed = 2000;

type Movable = RequireComponent<"movable" | "position">;

function move(entity: Movable, delta: number) {
  const entityPosition = entity.cp.position;

  const dAngle = entity.cp.movable.rotary;
  const dPos = entity.cp.movable.velocity * delta;
  const moveVec = [
    Math.cos(entityPosition.angle) * dPos,
    Math.sin(entityPosition.angle) * dPos,
  ];

  entityPosition.coord[0] += moveVec[0];
  entityPosition.coord[1] += moveVec[1];
  entityPosition.angle = (entityPosition.angle + dAngle) % (2 * Math.PI);
  entityPosition.moved = true;

  entity.cp.docks?.docked.forEach((docked) => {
    const dockedPosition = entity.sim.entities
      .get(docked)!
      .requireComponents(["position"]).cp.position;

    dockedPosition.coord[0] += moveVec[0];
    dockedPosition.coord[1] += moveVec[1];
    dockedPosition.angle += (entityPosition.angle + dAngle) % (2 * Math.PI);
    dockedPosition.moved = true;
  });

  const dVec = entity.cp.movable.acceleration * delta;
  entity.cp.movable.velocity = Math.min(
    entity.cp.movable.velocity + dVec,
    maxSpeed
  );
}

export class MovingSystem extends System {
  entities: Movable[];

  apply = (sim: Sim): void => {
    super.apply(sim);

    sim.hooks.phase.update.subscribe(this.constructor.name, this.exec);
  };

  // eslint-disable-next-line class-methods-use-this
  exec(delta: number): void {
    if (delta > 0) {
      for (const entity of entityIndexer.search(["movable", "position"])) {
        move(entity, delta);
      }
    }
  }
}

export const movingSystem = new MovingSystem();
