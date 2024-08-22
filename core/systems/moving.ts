import type { Sim } from "../sim";
import type { RequireComponent } from "../tsHelpers";
import { Index } from "./utils/entityIndex";
import { System } from "./system";

type Movable = RequireComponent<"movable" | "position">;

function move(entity: Movable, delta: number) {
  const entityPosition = entity.cp.position;

  // Offsetting so sprite (facing upwards) matches coords (facing rightwards)
  const entityAngle = entityPosition.angle - Math.PI / 2;
  const moveVec = [Math.cos(entityAngle), Math.sin(entityAngle)];
  const dAngle = entity.cp.movable.rotary;
  const dPos = entity.cp.movable.velocity * delta;

  entityPosition.coord[0] += moveVec[0] * dPos;
  entityPosition.coord[1] += moveVec[1] * dPos;
  entityPosition.angle += dAngle;
  entityPosition.moved = true;

  entity.cp.docks?.docked.forEach((docked) => {
    const dockedPosition = entity.sim.entities
      .get(docked)!
      .requireComponents(["position"]).cp.position;

    dockedPosition.coord[0] += moveVec[0] * dPos;
    dockedPosition.coord[1] += moveVec[1] * dPos;
    dockedPosition.angle += dAngle;
    dockedPosition.moved = true;
  });
}

export class MovingSystem extends System {
  entities: Movable[];
  index: Index<"movable" | "position">;

  apply = (sim: Sim): void => {
    super.apply(sim);

    this.index = new Index(sim, ["movable", "position"]);

    sim.hooks.phase.update.subscribe(this.constructor.name, this.exec);
  };

  exec = (delta: number): void => {
    if (delta > 0) {
      for (const entity of this.index.getIt()) {
        move(entity, delta);
      }
    }
  };
}

export const movingSystem = new MovingSystem();
