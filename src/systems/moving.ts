import { add, divide, Matrix, matrix, multiply, norm, subtract } from "mathjs";
import { Entity } from "../components/entity";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import { Query } from "./query";
import { System } from "./system";

type Driveable = RequireComponent<"drive" | "position">;

function move(entity: Driveable, delta: number) {
  entity.cp.drive.sim(delta);

  if (entity.cp.drive.target === null) return;

  const position =
    entity.cp.drive.target instanceof Entity
      ? entity.cp.drive.target.cp.position.coord
      : entity.cp.drive.target;
  const path = subtract(position, entity.cp.position.coord) as Matrix;
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
    entity.cp.position.coord = matrix(position);
    entity.cp.drive.targetReached = true;
    return;
  }

  if (canCruise && entity.cp.drive.state === "maneuver") {
    entity.cp.drive.startCruise();
  }

  if (!canCruise && entity.cp.drive.state === "cruise") {
    entity.cp.drive.stopCruise();
  }

  entity.cp.position.coord = add(entity.cp.position.coord, dPos) as Matrix;
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
