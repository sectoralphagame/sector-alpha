import { add, divide, Matrix, matrix, multiply, norm, subtract } from "mathjs";
import { Entity } from "../components/entity";
import { RequireComponent } from "../tsHelpers";
import { System } from "./system";

type Driveable = RequireComponent<"drive" | "position">;

function move(entity: Driveable, delta: number) {
  entity.cp.drive.sim(delta);

  if (entity.cp.drive.target === null) return;

  const position =
    entity.cp.drive.target instanceof Entity
      ? entity.cp.drive.target.cp.position.value
      : entity.cp.drive.target;
  const path = subtract(position, entity.cp.position.value) as Matrix;
  const speed =
    entity.cp.drive.state === "cruise"
      ? entity.cp.drive.cruise
      : entity.cp.drive.maneuver;
  const distance = norm(path);
  const canCruise =
    distance >
    (entity.cp.drive.state === "cruise" ? 3 : entity.cp.drive.ttc) *
      entity.cp.drive.maneuver;

  const dPos =
    norm(path) > 0
      ? (multiply(divide(path, norm(path)), speed * delta) as Matrix)
      : matrix([0, 0]);

  if (norm(dPos) >= distance) {
    entity.cp.position.value = matrix(position);
    entity.cp.drive.targetReached = true;
    return;
  }

  if (canCruise && entity.cp.drive.state === "maneuver") {
    entity.cp.drive.startCruise();
  }

  if (!canCruise && entity.cp.drive.state === "cruise") {
    entity.cp.drive.stopCruise();
  }

  entity.cp.position.value = add(entity.cp.position.value, dPos) as Matrix;
}

export class MovingSystem extends System {
  query = () =>
    this.sim.entities.filter((e) =>
      e.hasComponents(["drive", "position"])
    ) as Driveable[];

  exec = (delta: number): void => {
    this.query().forEach((entity) => move(entity, delta));
  };
}
