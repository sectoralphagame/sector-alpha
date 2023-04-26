import type { Matrix } from "mathjs";
import { add, matrix, random, norm, subtract } from "mathjs";
import { normalizeAngle } from "@core/utils/misc";
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
        entity.cp.orders.value[0].origin === "auto"
      ) {
        entity.cp.orders.value = [];
      }
    }
  }
}

function getFormationPlace(
  commander: RequireComponent<"subordinates" | "position">,
  entity: RequireComponent<"position">
): Matrix {
  const subordinates = commander.cp.subordinates.ids;
  const subordinateIndex = subordinates.findIndex(
    (subordinateId) => subordinateId === entity.id
  );
  const subordinatesCount = subordinates.length;
  const angle = commander.cp.position.angle;
  const distance = 0.1;
  const basePosition = matrix([
    (subordinateIndex - (subordinatesCount - 1) / 2) * 0.3,
    distance,
  ]);

  const x = basePosition.get([0]);
  const y = basePosition.get([1]);

  return add(
    matrix([
      x * Math.cos(angle) - y * Math.sin(angle),
      x * Math.sin(angle) + y * Math.cos(angle),
    ]),
    commander.cp.position.coord
  );
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

  const path = [
    targetPosition.coord.get([0]) - entityPosition.coord.get([0]),
    targetPosition.coord.get([1]) - entityPosition.coord.get([1]),
  ];

  const entityAngle = normalizeAngle(
    // Offsetting so sprite (facing upwards) matches coords (facing rightwards)
    entityPosition.angle - Math.PI / 2
  );
  const targetAngle = Math.atan2(path[1], path[0]);

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
  const targetPosition =
    entity.cp.commander?.id === targetEntity.id
      ? getFormationPlace(
          targetEntity.requireComponents(["subordinates", "position"]),
          entity
        )
      : targetEntity.cp.position!.coord;
  const isInSector = targetEntity.cp.position!.sector === entityPosition.sector;

  if (!isInSector) {
    hold(entity);
    return;
  }

  if (drive.mode === "flyby") {
    setFlybyDrive(entity, delta);
    return;
  }

  const path = [
    targetPosition.get([0]) - entityPosition.coord.get([0]),
    targetPosition.get([1]) - entityPosition.coord.get([1]),
  ];

  const entityAngle = normalizeAngle(
    // Offsetting so sprite (facing upwards) matches coords (facing rightwards)
    entityPosition.angle - Math.PI / 2
  );
  const targetAngle = Math.atan2(path[1], path[0]);

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

  apply = (sim: Sim): void => {
    super.apply(sim);

    this.query = new Query(sim, ["drive", "position"]);

    sim.hooks.phase.update.tap(this.constructor.name, this.exec);
  };

  exec = (delta: number): void => {
    this.query.get().forEach((entity) => setDrive(entity, delta));
  };
}
