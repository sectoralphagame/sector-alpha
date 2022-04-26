import { add, divide, Matrix, matrix, multiply, norm, subtract } from "mathjs";
import { Entity } from "../components/entity";
import { Sim } from "../sim";
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
  entities: Driveable[];

  query = () => {
    if (!this.entities) {
      this.entities = this.sim.entities.filter((e) =>
        e.hasComponents(["drive", "position"])
      ) as Driveable[];
    }

    return this.entities;
  };

  constructor(sim: Sim) {
    super(sim);
    sim.events.on("add-component", (entity) => {
      if (this.entities && entity.hasComponents(["drive", "position"])) {
        this.entities.push(entity);
      }
    });

    sim.events.on("remove-component", (payload) => {
      if (["drive", "position"].includes(payload.name)) {
        this.entities = this.entities.filter((e) => e.id !== payload.entity.id);
      }
    });
  }

  exec = (delta: number): void => {
    this.query().forEach((entity) => move(entity, delta));
  };
}
