import { add, Matrix, matrix, multiply, norm, subtract } from "mathjs";
import { clearTarget, startCruise, stopCruise } from "../components/drive";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import { Query } from "./query";
import { System } from "./system";

type Driveable = RequireComponent<"drive" | "position">;

function hold(entity: Driveable) {
  clearTarget(entity.cp.drive);
  if (entity.cp.orders) {
    if (entity.cp.owner) {
      if (entity.sim.getOrThrow(entity.cp.owner.id).cp.ai) {
        entity.cp.orders.value = [];
      } else {
        entity.cp.orders.value.unshift({
          type: "hold",
          orders: [{ type: "hold" }],
        });
      }
    }
  }
}

// eslint-disable-next-line no-underscore-dangle
function _normalizeAngle(value: number, start: number, end: number): number {
  const width = end - start;
  const offsetValue = value - start;

  return offsetValue - Math.floor(offsetValue / width) * width + start;
}
function normalizeAngle(value: number): number {
  return _normalizeAngle(value, -Math.PI, Math.PI);
}

export function getDeltaAngle(
  targetAngle: number,
  entityAngle: number,
  rotary: number,
  delta: number
): number {
  const angleDiff = normalizeAngle(targetAngle - entityAngle);
  const angleOffset = Math.abs(angleDiff);

  return angleOffset > rotary * delta
    ? rotary * delta * Math.sign(angleDiff)
    : angleDiff;
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

  if (norm(subtract(entity.cp.position.coord, targetPosition.coord)) < 0.1) {
    drive.targetReached = true;
    if (targetEntity.cp.destroyAfterUsage) {
      targetEntity.unregister();
    }
    return;
  }

  const entityAngle = normalizeAngle(
    // Offsetting so sprite (facing upwards) matches coords (facing rightwards)
    entityPosition.angle - Math.PI / 2
  );
  const path = subtract(targetPosition.coord, entityPosition.coord) as Matrix;
  const targetAngle = Math.atan2(path.get([1]), path.get([0]));
  const speed = drive.state === "cruise" ? drive.cruise : drive.maneuver;
  const distance = norm(path);
  const angleOffset = Math.abs(targetAngle - entityAngle);
  const canCruise =
    distance > (drive.state === "cruise" ? 3 : drive.ttc) * drive.maneuver &&
    angleOffset < Math.PI / 12;
  const moveVec = matrix([Math.cos(entityAngle), Math.sin(entityAngle)]);

  const dPos =
    norm(path) > 0
      ? (multiply(
          moveVec,
          angleOffset < Math.PI / 8 ? speed * delta : 0
        ) as Matrix)
      : matrix([0, 0]);
  const dAngle = getDeltaAngle(targetAngle, entityAngle, drive.rotary, delta);

  if (norm(dPos) >= distance) {
    entityPosition.coord = matrix(targetPosition.coord);
    drive.targetReached = true;
    if (targetEntity.cp.destroyAfterUsage) {
      targetEntity.unregister();
    }
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
