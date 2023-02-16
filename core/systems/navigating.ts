import { Matrix, norm, subtract } from "mathjs";
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

function setDrive(entity: Driveable, delta: number) {
  if (!entity.cp.drive.active) return;

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
    drive.currentSpeed = 0;
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

  const targetAngle = Math.atan2(path.get([1]), path.get([0]));
  const distance = norm(path) as number;
  const angleOffset = Math.abs(targetAngle - entityAngle);
  const canCruise =
    distance > (drive.state === "cruise" ? 3 : drive.ttc) * drive.maneuver &&
    angleOffset < Math.PI / 12 &&
    drive.limit > drive.maneuver;

  if (drive.mode === "follow") {
    if (targetEntity.cp.drive!.currentSpeed > drive.maneuver) {
      if (canCruise && drive.state === "maneuver") {
        entity.cooldowns.use(cruiseTimer, drive.ttc);
        startCruise(drive);
      }
    } else if (drive.state !== "maneuver") {
      stopCruise(drive);
    }

    if (distance <= 0.5) {
      entity.cp.drive.limit = targetEntity.cp.drive!.currentSpeed;
    } else {
      entity.cp.drive.limit = Infinity;
    }
  } else {
    entity.cp.drive.limit = Infinity;

    if (distance <= drive.minimalDistance) {
      if (entity === window.selected) {
        console.log("now");
      }
      drive.currentSpeed = 0;
      drive.targetReached = true;
      if (targetEntity.cp.destroyAfterUsage) {
        targetEntity.unregister();
      }
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
  }

  const maxSpeed = drive.state === "cruise" ? drive.cruise : drive.maneuver;
  const maxSpeedLimited = Math.min(drive.limit ?? Infinity, maxSpeed);
  drive.currentSpeed =
    angleOffset < Math.PI / 8
      ? limitMax(
          drive.currentSpeed + maxSpeed * drive.acceleration * delta,
          maxSpeedLimited
        )
      : 0;

  const dAngle = getDeltaAngle(targetAngle, entityAngle, drive.rotary, delta);

  drive.currentRotary = dAngle;
}

export class NavigatingSystem extends System {
  entities: Driveable[];
  query: Query<"drive" | "position">;

  constructor(sim: Sim) {
    super(sim);
    this.query = new Query(sim, ["drive", "position"]);
  }

  exec = (delta: number): void => {
    this.query.get().forEach((entity) => setDrive(entity, delta));
  };
}
