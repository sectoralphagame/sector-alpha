import { add, Matrix, matrix, multiply, norm, subtract } from "mathjs";
import { clearTarget, startCruise, stopCruise } from "../components/drive";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import { limitMax } from "../utils/limit";
import { Query } from "./query";
import { System } from "./system";

type Driveable = RequireComponent<"drive" | "position">;

function hold(entity: Driveable) {
  clearTarget(entity.cp.drive);
  if (entity.cp.orders) {
    if (entity.cp.owner) {
      if (
        entity.sim.getOrThrow(entity.cp.owner.id).cp.ai ||
        (entity.cp.commander && entity.cp.orders.value[0].origin === "auto")
      ) {
        entity.cp.orders.value = [];
      } else {
        entity.cp.orders.value.unshift({
          origin: "auto",
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

const cruiseTimer = "cruise";

function move(entity: Driveable, delta: number) {
  const entityPosition = entity.cp.position;
  const drive = entity.cp.drive;

  entity.cooldowns.update(delta);

  if (!drive.target) return;

  if (drive.state === "warming" && entity.cooldowns.canUse(cruiseTimer)) {
    drive.state = "cruise";
  }

  const targetEntity = entity.sim.get(drive.target);
  if (!targetEntity) {
    hold(entity);
    return;
  }
  const targetPosition = targetEntity.cp.position!;
  const isInSector = targetPosition.sector === entityPosition.sector;
  if (!isInSector) {
    hold(entity);
    return;
  }

  const path = subtract(targetPosition.coord, entityPosition.coord) as Matrix;
  if (norm(path) < 0.1) {
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
  const maxSpeed = drive.state === "cruise" ? drive.cruise : drive.maneuver;
  drive.currentSpeed = limitMax(
    drive.currentSpeed + maxSpeed * drive.acceleration * delta,
    maxSpeed
  );

  const targetAngle = Math.atan2(path.get([1]), path.get([0]));
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
          angleOffset < Math.PI / 8 ? drive.currentSpeed * delta : 0
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
    entity.cooldowns.canUse(cruiseTimer)
  ) {
    entity.cooldowns.use(cruiseTimer, drive.ttc);
    startCruise(drive);
  }

  if (!canCruise && drive.state === "cruise") {
    stopCruise(drive);
  }

  entityPosition.coord = add(entityPosition.coord, dPos) as Matrix;
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
