import { random, norm } from "mathjs";
import { normalizeAngle } from "@core/utils/misc";
import type { Position2D } from "@core/components/position";
import type { Driveable } from "@core/utils/moving";
import { clearTarget, startCruise, stopCruise } from "@core/utils/moving";
import { defaultDriveLimit } from "../components/drive";
import type { Sim } from "../sim";
import type { RequireComponent } from "../tsHelpers";
import { Index } from "./utils/entityIndex";
import { System } from "./system";

type Navigable = Driveable & RequireComponent<"position">;

function hold(entity: Navigable) {
  clearTarget(entity);
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
): Position2D {
  const subordinates = commander.cp.subordinates.ids;
  const subordinateIndex = subordinates.findIndex(
    (subordinateId) => subordinateId === entity.id
  );
  const subordinatesCount = subordinates.length;
  const angle = commander.cp.position.angle;
  const distance = 0.1;

  const x = (subordinateIndex - (subordinatesCount - 1) / 2) * 0.3;
  const y = distance;

  return [
    x * Math.cos(angle) - y * Math.sin(angle) + commander.cp.position.coord[0],
    x * Math.sin(angle) + y * Math.cos(angle) + commander.cp.position.coord[1],
  ];
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

function setFlybyDrive(entity: Navigable, delta: number) {
  const drive = entity.cp.drive;
  const movable = entity.cp.movable;
  const entityPosition = entity.cp.position;
  const targetEntity = entity.sim.get(drive.target!)!;
  const targetPosition = targetEntity.cp.position!;

  const path = [
    targetPosition.coord[0] - entityPosition.coord[0],
    targetPosition.coord[1] - entityPosition.coord[1],
  ];

  const entityAngle = normalizeAngle(
    // Offsetting so sprite (facing upwards) matches coords (facing rightwards)
    entityPosition.angle - Math.PI / 2
  );
  const targetAngle = Math.atan2(path[1], path[0]);

  const distance = norm(path) as number;
  const angleOffset = Math.abs(normalizeAngle(targetAngle - entityAngle));
  const isInRange = (targetEntity.cp.damage?.range ?? 0) + 0.2 > distance;

  const shieldsUp = entity.cp.hitpoints?.shield
    ? entity.cp.hitpoints.shield.value / entity.cp.hitpoints.shield.max > 0.5
    : true;

  movable.rotary =
    angleOffset > Math.PI * 0.85 &&
    (isInRange || !shieldsUp || Math.random() > 0.3)
      ? 0
      : getDeltaAngle(targetAngle, entityAngle, drive.rotary, delta);

  const canCruise =
    distance > (drive.state === "cruise" ? 3 : drive.ttc) * drive.maneuver &&
    angleOffset < Math.PI / 12 &&
    drive.limit > drive.maneuver;

  entity.cp.drive.limit = defaultDriveLimit;
  if (
    (targetEntity.cp.movable?.velocity ?? 0) > drive.maneuver ||
    distance > drive.maneuver * drive.ttc
  ) {
    if (canCruise && drive.state === "maneuver") {
      entity.cooldowns.use(cruiseTimer, drive.ttc);
      startCruise(entity);
    }
  } else if (drive.state !== "maneuver") {
    stopCruise(entity);
  }

  const maxSpeed = drive.state === "cruise" ? drive.cruise : drive.maneuver;
  const maxSpeedLimited = Math.min(drive.limit ?? defaultDriveLimit, maxSpeed);
  const deltaSpeedMultiplier =
    angleOffset > Math.PI / 3 ? random(0.1, 0.55) : 1;
  movable.velocity = Math.max(
    0,
    Math.min(
      movable.velocity +
        maxSpeed * drive.acceleration * delta * deltaSpeedMultiplier,
      maxSpeedLimited
    )
  );
}

function setDrive(entity: Navigable, delta: number) {
  if (!entity.cp.drive.active || delta === 0) return;

  const entityPosition = entity.cp.position;
  const drive = entity.cp.drive;
  const movable = entity.cp.movable;

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
    targetPosition[0] - entityPosition.coord[0],
    targetPosition[1] - entityPosition.coord[1],
  ];

  const entityAngle = normalizeAngle(
    // Offsetting so sprite (facing upwards) matches coords (facing rightwards)
    entityPosition.angle - Math.PI / 2
  );
  const targetAngle = Math.atan2(path[1], path[0]);

  const distance = norm(path) as number;
  const angleOffset = Math.abs(targetAngle - entityAngle);

  movable.rotary = getDeltaAngle(targetAngle, entityAngle, drive.rotary, delta);

  if (distance < 0.1) {
    movable.velocity = 0;
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
      targetEntity.cp.movable!.velocity > drive.maneuver ||
      distance > drive.maneuver * drive.ttc
    ) {
      if (canCruise && drive.state === "maneuver") {
        entity.cooldowns.use(cruiseTimer, drive.ttc);
        startCruise(entity);
      }
    } else if (drive.state !== "maneuver") {
      stopCruise(entity);
    }

    if (distance <= 0.5) {
      entity.cp.drive.limit = targetEntity.cp.movable!.velocity;
    } else {
      entity.cp.drive.limit = defaultDriveLimit;
    }
  } else {
    entity.cp.drive.limit = defaultDriveLimit;

    if (distance <= drive.minimalDistance) {
      movable.velocity = 0;
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
      startCruise(entity);
    }

    if (!canCruise && drive.state === "cruise") {
      stopCruise(entity);
    }
  }

  const maxSpeed = drive.state === "cruise" ? drive.cruise : drive.maneuver;
  const maxSpeedLimited = Math.min(drive.limit ?? defaultDriveLimit, maxSpeed);
  const speedMultiplier = angleOffset < Math.PI / 8 ? 1 : 0;

  movable.velocity =
    speedMultiplier *
    Math.max(
      0,
      Math.min(
        movable.velocity + maxSpeed * drive.acceleration * delta,
        maxSpeedLimited
      )
    );
}

export class NavigatingSystem extends System {
  entities: Navigable[];
  index: Index<"drive" | "movable" | "position">;

  apply = (sim: Sim): void => {
    super.apply(sim);

    this.index = new Index(sim, ["drive", "movable", "position"]);

    sim.hooks.phase.update.subscribe(this.constructor.name, this.exec);
  };

  exec = (delta: number): void => {
    for (const entity of this.index.getIt()) {
      setDrive(entity, delta);
    }
  };
}

export const navigatingSystem = new NavigatingSystem();
