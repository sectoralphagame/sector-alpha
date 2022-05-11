import { add, Matrix, matrix, multiply, norm, subtract } from "mathjs";
import { Entity } from "../components/entity";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import { Query } from "./query";
import { System } from "./system";

type Driveable = RequireComponent<"drive" | "position">;

function move(entity: Driveable, delta: number) {
  entity.cp.drive.sim(delta);

  if (entity.cp.drive.target === null) return;

  const entityPosition = entity.cp.position;
  const drive = entity.cp.drive;

  const targetPosition =
    drive.target instanceof Entity
      ? drive.target.cp.position.coord
      : drive.target;
  const path = subtract(targetPosition, entityPosition.coord) as Matrix;
  // TODO: Investigate magic that is happening here with 90deg offsets
  const targetAngle = Math.atan2(path.get([1]), path.get([0])) + Math.PI / 2;
  const speed = drive.state === "cruise" ? drive.cruise : drive.maneuver;
  const distance = norm(path);
  const canCruise =
    distance > (drive.state === "cruise" ? 3 : drive.ttc) * drive.maneuver &&
    targetAngle - entityPosition.angle < Math.PI / 12;
  const moveVec = matrix([
    Math.cos(entityPosition.angle - Math.PI / 2),
    Math.sin(entityPosition.angle - Math.PI / 2),
  ]);

  const dPos =
    norm(path) > 0
      ? (multiply(moveVec, speed * delta) as Matrix)
      : matrix([0, 0]);
  const dAngle =
    drive.rotary * delta * Math.sign(targetAngle - entityPosition.angle);

  if (norm(dPos) >= distance) {
    entityPosition.coord = matrix(targetPosition);
    drive.targetReached = true;
    return;
  }

  if (canCruise && drive.state === "maneuver") {
    drive.startCruise();
  }

  if (!canCruise && drive.state === "cruise") {
    drive.stopCruise();
  }

  entityPosition.coord = add(entityPosition.coord, dPos) as Matrix;
  entityPosition.angle += dAngle;
}

export class MovingSystem extends System {
  entities: Driveable[];
  query: Query<"drive" | "position">;

  constructor(sim: Sim) {
    super(sim);
    this.query = new Query(sim, ["drive", "position"]);
  }

  exec = (delta: number): void => {
    this.query.get().forEach((entity) => move(entity, delta));
  };
}
