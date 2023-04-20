import type { Matrix } from "mathjs";
import { add, matrix, multiply } from "mathjs";
import { normalizeAngle } from "@core/utils/misc";
import type { Sim } from "../sim";
import type { RequireComponent } from "../tsHelpers";
import { Query } from "./utils/query";
import { System } from "./system";

type Driveable = RequireComponent<"drive" | "position">;

function move(entity: Driveable, delta: number) {
  const entityPosition = entity.cp.position;
  const drive = entity.cp.drive;

  const entityAngle = normalizeAngle(
    // Offsetting so sprite (facing upwards) matches coords (facing rightwards)
    entityPosition.angle - Math.PI / 2
  );
  const moveVec = matrix([Math.cos(entityAngle), Math.sin(entityAngle)]);
  const dPos = multiply(moveVec, drive.currentSpeed * delta) as Matrix;
  const dAngle = drive.currentRotary;

  entityPosition.coord = add(entityPosition.coord, dPos);
  entityPosition.angle += dAngle;
  entityPosition.moved = true;

  entity.cp.docks?.docked.forEach((docked) => {
    const dockedPosition = entity.sim.entities
      .get(docked)!
      .requireComponents(["position"]).cp.position;

    dockedPosition.coord = matrix(entityPosition.coord);
    dockedPosition.angle += dAngle;
  });
}

export class MovingSystem extends System {
  entities: Driveable[];
  query: Query<"drive" | "position">;

  apply = (sim: Sim): void => {
    super.apply(sim);

    this.query = new Query(sim, ["drive", "position"]);

    sim.hooks.phase.update.tap(this.constructor.name, this.exec);
  };

  exec = (delta: number): void => {
    if (delta > 0) {
      this.query.get().forEach((entity) => move(entity, delta));
    }
  };
}
