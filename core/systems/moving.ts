import type { Matrix } from "mathjs";
import { add, matrix, multiply } from "mathjs";
import type { Sim } from "../sim";
import type { RequireComponent } from "../tsHelpers";
import { Query } from "./query";
import { System } from "./system";

type Driveable = RequireComponent<"drive" | "position">;

// eslint-disable-next-line no-underscore-dangle
function _normalizeAngle(value: number, start: number, end: number): number {
  const width = end - start;
  const offsetValue = value - start;

  return offsetValue - Math.floor(offsetValue / width) * width + start;
}
function normalizeAngle(value: number): number {
  return _normalizeAngle(value, -Math.PI, Math.PI);
}

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

  constructor(sim: Sim) {
    super(sim);
    this.query = new Query(sim, ["drive", "position"]);
  }

  exec = (delta: number): void => {
    if (delta > 0) {
      this.query.get().forEach((entity) => move(entity, delta));
    }
  };
}
