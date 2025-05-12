import { getAngleDiff } from "@core/utils/misc";
import type { Driveable } from "@core/utils/moving";
import { clearTarget, startCruise, stopCruise } from "@core/utils/moving";
import { Vec2 } from "ogl";
import { entityIndexer } from "@core/entityIndexer/entityIndexer";
import { Observable } from "@core/utils/observer";
import { random } from "mathjs";
import clamp from "lodash/clamp";
import { defaultDriveLimit } from "../components/drive";
import type { Sim } from "../sim";
import type { RequireComponent } from "../tsHelpers";
import { System } from "./system";
import { dragCoeff } from "./moving";

const tempPosition = new Vec2();
const tempVelocity = new Vec2();
const tempThrust = new Vec2();
const tempForward = new Vec2();

type Navigable = Driveable & RequireComponent<"position">;

interface Thrust {
  direction: Vec2;
  throttle: number;
  drag: number;
}

function hold(entity: Navigable) {
  clearTarget(entity);
  if (entity.cp.orders) {
    if (entity.cp.owner) {
      if (
        entity.sim.getOrThrow(entity.cp.owner.id).cp.ai ||
        entity.cp.orders.value[0]?.origin === "auto"
      ) {
        entity.cp.orders.value = [];
      }
    }
  }
}

function getFormationPlace(
  commander: RequireComponent<"subordinates" | "position">,
  entity: RequireComponent<"position">
): Vec2 {
  const subordinates = commander.cp.subordinates.ids;
  const subordinateIndex = subordinates.findIndex(
    (subordinateId) => subordinateId === entity.id
  );
  const subordinatesCount = subordinates.length;
  const angle = commander.cp.position.angle;
  const distance = 0.1;

  const x = distance;
  const y = (subordinateIndex - (subordinatesCount - 1) / 2) * 0.3;

  return new Vec2(
    x * Math.cos(angle) - y * Math.sin(angle) + commander.cp.position.coord.x,
    x * Math.sin(angle) + y * Math.cos(angle) + commander.cp.position.coord.y
  );
}

export function getDeltaAngle(
  dAngle: number,
  angular: number,
  delta: number
): number {
  return angular * delta * Math.sign(dAngle);
}

function getBrakingDistance(entity: Navigable): number {
  const speed = entity.cp.movable.velocity.len();
  const acceleration = entity.cp.drive.acceleration;
  const drag = dragCoeff + entity.cp.movable.drag;

  return speed ** 2 / (2 * (acceleration - speed * drag));
}

function brake(entity: Navigable, targetSpeed: number, thrust: Thrust) {
  const speed = entity.cp.movable.velocity.len();

  if (speed > targetSpeed) {
    thrust.direction.copy(entity.cp.movable.velocity).normalize().negate();
    thrust.throttle = 1;
  }
  // thrust.acceleration = (speed - targetSpeed) / speed;

  return thrust;
}

function applyThrust(
  entity: Navigable,
  forward: Vec2,
  thrust: Thrust,
  angular: number,
  delta: number
) {
  const cross = forward.x * thrust.direction.y - forward.y * thrust.direction.x;
  const dot = forward.dot(thrust.direction);
  const angleToTarget = Math.atan2(cross, dot);
  entity.cp.movable.rotary = getDeltaAngle(
    angleToTarget,
    entity.cp.drive.rotary * clamp(angular, 0.2, 1),
    delta
  );
  entity.cp.movable.acceleration
    .copy(thrust.direction)
    .multiply(entity.cp.drive.acceleration * clamp(thrust.throttle, 0, 1));
  entity.cp.movable.drag = clamp(thrust.drag, 0, 1);
}

const cruiseTimer = "cruise";

let navigatingSystem: NavigatingSystem;
export class NavigatingSystem extends System {
  entities: Navigable[];
  hook: Observable<Navigable> = new Observable<Navigable>("onTargetReached");

  constructor() {
    super();

    navigatingSystem = this;
  }

  private setFlybyDrive(
    entity: Navigable,
    delta: number,
    alignmentAngleToV: number
  ) {
    const drive = entity.cp.drive;
    const movable = entity.cp.movable;
    const entityPosition = entity.cp.position;
    const targetEntity = this.sim.get(drive.target!)!;
    const targetPosition = targetEntity.cp.position!;

    const path = tempPosition
      .set(targetPosition.coord)
      .sub(entityPosition.coord);
    const targetAngle = getAngleDiff(entity, path);

    const distance = path.len();
    const angleOffset = Math.abs(targetAngle);
    const isInRange =
      (targetEntity.cp.damage?.range ?? 0) + 0.2 > distance &&
      angleOffset < (entity.cp.damage?.angle || 0);

    const shieldsUp = entity.cp.hitpoints?.shield
      ? entity.cp.hitpoints.shield.value / entity.cp.hitpoints.shield.max > 0.5
      : true;

    if (Math.PI - Math.abs(targetAngle) < 0.1) {
      movable.rotary = drive.rotary * delta * Math.sign(Math.random() - 0.5);
    } else {
      movable.rotary =
        angleOffset > Math.PI * 0.85 &&
        (isInRange || !shieldsUp || Math.random() > 0.3)
          ? 0
          : getDeltaAngle(targetAngle, drive.rotary, delta);
      // : Math.min(Math.abs(dAngle), drive.rotary) *
      //   Math.sign(dAngle) *
      //   delta;
    }

    const canCruise =
      distance > (drive.state === "cruise" ? 3 : drive.ttc) * drive.maneuver &&
      angleOffset < Math.PI / 12 &&
      drive.limit > drive.maneuver &&
      alignmentAngleToV < 0.005;

    entity.cp.drive.limit = defaultDriveLimit;
    if (
      (targetEntity.cp.movable?.velocity.len() ?? 0) > drive.maneuver ||
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
    const maxSpeedLimited = Math.min(drive.limit, defaultDriveLimit, maxSpeed);
    const speedMultiplier = angleOffset > Math.PI / 3 ? random(0.55, 0.8) : 1;
    drive.targetVelocity = maxSpeedLimited * speedMultiplier;
  }

  private setDrive(entity: Navigable, delta: number) {
    if (!entity.cp.drive.active || delta === 0) return;

    const entityPosition = entity.cp.position;
    const drive = entity.cp.drive;
    const movable = entity.cp.movable;
    const speed = movable.velocity.len();

    const angleDotV =
      speed > 0
        ? tempPosition
            .set(
              Math.cos(entity.cp.position.angle),
              Math.sin(entity.cp.position.angle)
            )
            .dot(tempVelocity.copy(movable.velocity).normalize())
        : 1;
    const alignmentAngleToV = (angleDotV + 1) / 2;

    if (angleDotV > 0) {
      movable.acceleration
        .set(
          Math.cos(entity.cp.position.angle),
          Math.sin(entity.cp.position.angle)
        )
        .multiply(
          drive.acceleration *
            Math.sign(drive.targetVelocity - speed) *
            (drive.state === "cruise" ? 3 : 1)
        );
    } else {
      movable.acceleration
        .copy(movable.velocity)
        .normalize()
        .multiply(drive.acceleration * angleDotV);
    }
    movable.drag = drive.state === "cruise" ? 0 : 1 - alignmentAngleToV;

    if (!drive.target) return;
    const targetEntity = this.sim.get(drive.target);
    if (!targetEntity) {
      hold(entity);
      return;
    }

    if (drive.state === "warming" && entity.cooldowns.canUse(cruiseTimer)) {
      drive.state = "cruise";
    }

    const targetPosition =
      entity.cp.commander?.id === targetEntity.id &&
      targetEntity.hasComponents(["drive"])
        ? getFormationPlace(
            targetEntity.requireComponents(["subordinates", "position"]),
            entity
          )
        : targetEntity.cp.position!.coord;
    const isInSector =
      targetEntity.cp.position!.sector === entityPosition.sector;

    if (!isInSector) {
      hold(entity);
      return;
    }

    if (drive.mode === "flyby") {
      this.setFlybyDrive(entity, delta, alignmentAngleToV);
      return;
    }

    const path = tempPosition.copy(targetPosition).sub(entityPosition.coord);

    const angleToTarget = getAngleDiff(entity, path);

    const distance = path.len();
    const angleOffset = Math.abs(angleToTarget);
    const targetAngle = angleToTarget;

    movable.rotary = getDeltaAngle(targetAngle, drive.rotary, delta);
    // movable.rotary = Math.min(Math.abs(dAngle), drive.rotary) * Math.sign(dAngle) * delta;

    if (distance <= drive.minimalDistance) {
      drive.targetVelocity = 0;
      movable.rotary = 0;
      this.hook.notify(entity);
      return;
    }
    if (distance < getBrakingDistance(entity)) {
      drive.targetVelocity = 0;
    }

    const canCruise =
      distance > (drive.state === "cruise" ? 3 : drive.ttc) * drive.maneuver &&
      angleOffset < Math.PI / 12 &&
      drive.limit > drive.maneuver &&
      alignmentAngleToV < 0.005;

    if (drive.mode === "follow" && targetEntity.cp.drive) {
      if (
        targetEntity.cp.movable!.velocity.len() > drive.maneuver ||
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
        entity.cp.drive.limit = movable.velocity.len();
      } else {
        entity.cp.drive.limit = defaultDriveLimit;
      }
    } else {
      entity.cp.drive.limit = defaultDriveLimit;

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
    const maxSpeedLimited = Math.min(
      drive.limit ?? defaultDriveLimit,
      maxSpeed
    );
    const speedMultiplier = 1;

    drive.targetVelocity = maxSpeedLimited * speedMultiplier;
  }

  setDriveV2(entity: Navigable, delta: number) {
    if (!entity.cp.drive.active || delta === 0) return;

    if (!entity.cp.drive.target) {
      entity.cp.movable.acceleration.set(0, 0);
      return;
    }

    const targetEntity = this.sim.get(entity.cp.drive.target);
    if (!targetEntity || !targetEntity.hasComponents(["position"])) {
      hold(entity);
      return;
    }

    const distanceToTarget = targetEntity.cp.position.coord.distance(
      entity.cp.position.coord
    );
    const speed = entity.cp.movable.velocity.len();
    // const speedPercent =
    //   speed /
    //   (entity.cp.drive.state === "cruise"
    //     ? entity.cp.drive.cruise
    //     : entity.cp.drive.maneuver);
    const forward = tempForward.set(
      Math.cos(entity.cp.position.angle),
      Math.sin(entity.cp.position.angle)
    );
    const thrust: Thrust = {
      direction: tempThrust
        .copy(targetEntity.cp.position.coord)
        .sub(entity.cp.position.coord)
        .normalize(),
      throttle: 1,
      drag: 0,
    };
    let angular = 1;

    const alignmentToTarget = forward.dot(thrust.direction);
    const alignmentToVelocity =
      speed > 0
        ? forward.dot(tempVelocity.copy(entity.cp.movable.velocity).normalize())
        : 1;

    angular =
      (Math.min(1, 1 - speed / entity.cp.drive.maneuver + 0.3) *
        (alignmentToTarget + 1)) /
      2;
    thrust.drag = Math.min(0.7, (1 - alignmentToTarget) ** 2);

    if (alignmentToTarget < 0.8) {
      thrust.throttle = clamp((alignmentToVelocity + 1) / 2, 0, 1);
    }

    if (
      speed > 0 &&
      distanceToTarget < getBrakingDistance(entity) * 2 &&
      entity.cp.drive.mode !== "flyby"
    ) {
      const targetSpeed =
        targetEntity.cp.movable?.velocity.len() ??
        entity.cp.drive.acceleration * 0.75;
      brake(entity, targetSpeed, thrust);
    } else if (
      speed > 0 &&
      distanceToTarget < entity.cp.drive.minimalDistance
    ) {
      brake(entity, 0, thrust);
    }
    if (speed > 0 && alignmentToVelocity > 0 && alignmentToTarget < 0) {
      brake(entity, 0, thrust);
    }

    applyThrust(entity, forward, thrust, angular, delta);
  }

  apply(sim: Sim): void {
    super.apply(sim);

    sim.hooks.phase.update.subscribe(
      this.constructor.name,
      this.exec.bind(this)
    );
    sim.hooks.destroy.subscribe(this.constructor.name, () => {
      this.hook.observers.clear();
    });
  }

  // eslint-disable-next-line class-methods-use-this
  exec(delta: number): void {
    for (const entity of entityIndexer.search([
      "drive",
      "movable",
      "position",
    ])) {
      this.setDriveV2(entity, delta);
    }
  }

  static getInstance(): NavigatingSystem {
    return navigatingSystem;
  }

  static onTargetReached(origin: string, fn: (_entity: Navigable) => void) {
    return NavigatingSystem.getInstance().hook.subscribe(origin, fn);
  }
}
