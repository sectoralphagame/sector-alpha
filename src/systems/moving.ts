import { add, Matrix, matrix, multiply, norm, subtract } from "mathjs";
import { clearTarget, startCruise, stopCruise } from "../components/drive";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import { Query } from "./query";
import { System } from "./system";

type Driveable = RequireComponent<"drive" | "position">;

function hold(entity: Driveable) {
  console.warn("Order cannot be fulfilled");
  clearTarget(entity.cp.drive);
  if (entity.cp.orders) {
    entity.cp.orders.value.unshift({
      type: "hold",
      orders: [{ type: "hold" }],
    });
  }
}

function move(entity: Driveable, delta: number) {
  const entityPosition = entity.cp.position;
  const drive = entity.cp.drive;

  entity.cooldowns.update(delta);

  if (!drive.target) return;

  if (drive.state === "warming" && entity.cooldowns.canUse("cruise")) {
    drive.state = "cruise";
  }

  const targetEntity = entity.sim.get(drive.target);
  if (!targetEntity) {
    hold(entity);
    return;
  }
  const targetPosition = targetEntity.cp.position!;
  const isInSector = targetPosition.sector === entity.cp.position.sector;
  if (!isInSector) {
    hold(entity);
    return;
  }
  const path = subtract(targetPosition.coord, entityPosition.coord) as Matrix;
  // TODO: Investigate magic that is happening here with 90deg offsets
  const targetAngle = Math.atan2(path.get([1]), path.get([0])) + Math.PI / 2;
  const speed = drive.state === "cruise" ? drive.cruise : drive.maneuver;
  const distance = norm(path);
  const angleOffset = Math.abs(targetAngle - entityPosition.angle);
  const canCruise =
    distance > (drive.state === "cruise" ? 3 : drive.ttc) * drive.maneuver &&
    angleOffset < Math.PI / 12;
  const moveVec = matrix([
    Math.cos(entityPosition.angle - Math.PI / 2),
    Math.sin(entityPosition.angle - Math.PI / 2),
  ]);

  const dPos =
    norm(path) > 0
      ? (multiply(moveVec, speed * delta) as Matrix)
      : matrix([0, 0]);
  const dAngle =
    angleOffset > drive.rotary * delta
      ? drive.rotary * delta * Math.sign(targetAngle - entityPosition.angle)
      : targetAngle - entityPosition.angle;

  if (norm(dPos) >= distance) {
    entityPosition.coord = matrix(targetPosition.coord);
    drive.targetReached = true;
    return;
  }

  if (
    canCruise &&
    drive.state === "maneuver" &&
    entity.cooldowns.canUse("drive")
  ) {
    entity.cooldowns.use("drive", drive.ttc);
    startCruise(drive);
  }

  if (!canCruise && drive.state === "cruise") {
    stopCruise(drive);
  }

  entityPosition.coord = add(entityPosition.coord, dPos) as Matrix;
  entityPosition.angle += dAngle;

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
    this.query.get().forEach((entity) => move(entity, delta));
  };
}
