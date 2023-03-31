import type { Matrix } from "mathjs";
import { random, norm, subtract } from "mathjs";
import {
  clearTarget,
  defaultDriveLimit,
  startCruise,
  stopCruise,
} from "../components/drive";
import type { Sim } from "../sim";
import type { RequireComponent } from "../tsHelpers";
import { Query } from "./utils/query";
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

function setFlybyDrive(entity: Driveable, delta: number) {
  const drive = entity.cp.drive;
  const entityPosition = entity.cp.position;
  const targetEntity = entity.sim.get(drive.target!)!;
  const targetPosition = targetEntity.cp.position!;

  const path = subtract(targetPosition.coord, entityPosition.coord) as Matrix;

  const entityAngle = normalizeAngle(
    // Offsetting so sprite (facing upwards) matches coords (facing rightwards)
    entityPosition.angle - Math.PI / 2
  );
  const targetAngle = Math.atan2(path.get([1]), path.get([0]));

  const distance = norm(path) as number;
  const angleOffset = Math.abs(normalizeAngle(targetAngle - entityAngle));
  const isInRange = (targetEntity.cp.damage?.range ?? 0) + 0.2 > distance;

  drive.currentRotary =
    angleOffset > Math.PI * 0.85 && (isInRange || Math.random() > 0.3)
      ? 0
      : getDeltaAngle(targetAngle, entityAngle, drive.rotary, delta);

  const canCruise =
    distance > (drive.state === "cruise" ? 3 : drive.ttc) * drive.maneuver &&
    angleOffset < Math.PI / 12 &&
    drive.limit > drive.maneuver;

  entity.cp.drive.limit = defaultDriveLimit;
  if (
    (targetEntity.cp.drive?.currentSpeed ?? 0) > drive.maneuver ||
    distance > drive.maneuver * drive.ttc
  ) {
    if (canCruise && drive.state === "maneuver") {
      entity.cooldowns.use(cruiseTimer, drive.ttc);
      startCruise(drive);
    }
  } else if (drive.state !== "maneuver") {
    stopCruise(drive);
  }

  const maxSpeed = drive.state === "cruise" ? drive.cruise : drive.maneuver;
  const maxSpeedLimited = Math.min(drive.limit ?? defaultDriveLimit, maxSpeed);
  const deltaSpeedMultiplier =
    angleOffset > Math.PI / 3 ? random(0.1, 0.55) : 1;
  drive.currentSpeed = Math.max(
    0,
    Math.min(
      drive.currentSpeed +
        maxSpeed * drive.acceleration * delta * deltaSpeedMultiplier,
      maxSpeedLimited
    )
  );
}

function setDrive(entity: Driveable, delta: number) {
  if (!entity.cp.drive.active || delta === 0) return;

  const entityPosition = entity.cp.position;
  const drive = entity.cp.drive;

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

  if (drive.mode === "flyby") {
    setFlybyDrive(entity, delta);
    return;
  }

  const path = subtract(targetPosition.coord, entityPosition.coord) as Matrix;

  const entityAngle = normalizeAngle(
    // Offsetting so sprite (facing upwards) matches coords (facing rightwards)
    entityPosition.angle - Math.PI / 2
  );
  const targetAngle = Math.atan2(path.get([1]), path.get([0]));

  const distance = norm(path) as number;
  const angleOffset = Math.abs(targetAngle - entityAngle);

  drive.currentRotary = getDeltaAngle(
    targetAngle,
    entityAngle,
    drive.rotary,
    delta
  );

  if (distance < 0.1) {
    drive.currentSpeed = 0;
    drive.targetReached = true;
    if (targetEntity.cp.disposable) {
      targetEntity.unregister();
    }
    return;
  }

  const canCruise =
    distance > (drive.state === "cruise" ? 3 : drive.ttc) * drive.maneuver &&
    angleOffset < Math.PI / 12 &&
    drive.limit > drive.maneuver;

  if (drive.mode === "follow" && targetEntity.cp.drive) {
    if (
      targetEntity.cp.drive!.currentSpeed > drive.maneuver ||
      distance > drive.maneuver * drive.ttc
    ) {
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
      entity.cp.drive.limit = defaultDriveLimit;
    }
  } else {
    entity.cp.drive.limit = defaultDriveLimit;

    if (distance <= drive.minimalDistance) {
      drive.currentSpeed = 0;
      drive.targetReached = true;
      if (targetEntity.cp.disposable) {
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
  const maxSpeedLimited = Math.min(drive.limit ?? defaultDriveLimit, maxSpeed);
  const speedMultiplier = angleOffset < Math.PI / 8 ? 1 : 0;

  drive.currentSpeed =
    speedMultiplier *
    Math.max(
      0,
      Math.min(
        drive.currentSpeed + maxSpeed * drive.acceleration * delta,
        maxSpeedLimited
      )
    );
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
