import { random } from "mathjs";
import { getAngleDiff } from "@core/utils/misc";
import type { Driveable } from "@core/utils/moving";
import { clearTarget, startCruise, stopCruise } from "@core/utils/moving";
import { Vec2 } from "ogl";
import { entityIndexer } from "@core/entityIndexer/entityIndexer";
import { Observable } from "@core/utils/observer";
import { defaultDriveLimit } from "../components/drive";
import type { Sim } from "../sim";
import type { RequireComponent } from "../tsHelpers";
import { System } from "./system";

const tempPosition = new Vec2();

type Navigable = Driveable & RequireComponent<"position">;

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
  rotary: number,
  delta: number
): number {
  const angleOffset = Math.abs(dAngle);

  return angleOffset > rotary * delta
    ? rotary * delta * Math.sign(dAngle)
    : dAngle + Math.random() * 0.001 * -Math.sign(dAngle);
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

  private setFlybyDrive(entity: Navigable, delta: number) {
    const drive = entity.cp.drive;
    const movable = entity.cp.movable;
    const entityPosition = entity.cp.position;
    const targetEntity = this.sim.get(drive.target!)!;
    const targetPosition = targetEntity.cp.position!;

    const path = tempPosition
      .set(targetPosition.coord)
      .sub(entityPosition.coord);
    const dAngle = getAngleDiff(entity, path);

    const distance = path.len();
    const angleOffset = Math.abs(dAngle);
    const isInRange =
      (targetEntity.cp.damage?.range ?? 0) + 0.2 > distance &&
      angleOffset < (entity.cp.damage?.angle || 0);

    const shieldsUp = entity.cp.hitpoints?.shield
      ? entity.cp.hitpoints.shield.value / entity.cp.hitpoints.shield.max > 0.5
      : true;

    if (Math.PI - Math.abs(dAngle) < 0.1) {
      movable.rotary = drive.rotary * delta * Math.random() > 0.5 ? 1 : -1;
    } else {
      movable.rotary =
        angleOffset > Math.PI * 0.85 &&
        (isInRange || !shieldsUp || Math.random() > 0.3)
          ? 0
          : getDeltaAngle(dAngle, drive.rotary, delta);
    }

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
    const maxSpeedLimited = Math.min(drive.limit, defaultDriveLimit, maxSpeed);
    const speedMultiplier = angleOffset > Math.PI / 3 ? random(0.55, 0.8) : 1;
    drive.targetVelocity = maxSpeedLimited * speedMultiplier;
  }

  private setDrive(entity: Navigable, delta: number) {
    if (!entity.cp.drive.active || delta === 0) return;

    const entityPosition = entity.cp.position;
    const drive = entity.cp.drive;
    const movable = entity.cp.movable;

    movable.acceleration =
      drive.acceleration * Math.sign(drive.targetVelocity - movable.velocity);

    if (!drive.target) return;

    if (drive.state === "warming" && entity.cooldowns.canUse(cruiseTimer)) {
      drive.state = "cruise";
    }

    const targetEntity = this.sim.get(drive.target);
    if (!targetEntity) {
      hold(entity);
      return;
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
      this.setFlybyDrive(entity, delta);
      return;
    }

    const path = tempPosition.copy(targetPosition).sub(entityPosition.coord);

    const dAngle = getAngleDiff(entity, path);

    const distance = path.len();
    const angleOffset = Math.abs(dAngle);

    movable.rotary = getDeltaAngle(dAngle, drive.rotary, delta);

    if (distance <= drive.minimalDistance) {
      drive.targetVelocity = 0;
      movable.acceleration = -drive.acceleration * 3;
      this.hook.notify(entity);
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
    const speedMultiplier = angleOffset < Math.PI / 8 ? 1 : -1;

    drive.targetVelocity = maxSpeedLimited * speedMultiplier;
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
      this.setDrive(entity, delta);
    }
  }

  static getInstance(): NavigatingSystem {
    return navigatingSystem;
  }

  static onTargetReached(origin: string, fn: (_entity: Navigable) => void) {
    return NavigatingSystem.getInstance().hook.subscribe(origin, fn);
  }
}
