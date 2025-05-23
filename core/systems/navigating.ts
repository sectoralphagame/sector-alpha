import { getAngleDiff } from "@core/utils/misc";
import type { Driveable } from "@core/utils/moving";
import { clearTarget, startCruise, stopCruise } from "@core/utils/moving";
import { Vec2 } from "ogl";
import { entityIndexer } from "@core/entityIndexer/entityIndexer";
import { Observable } from "@core/utils/observer";
import { random } from "mathjs";
import { defaultDriveLimit } from "../components/drive";
import type { Sim } from "../sim";
import type { RequireComponent } from "../tsHelpers";
import { System } from "./system";
import { goToPosition } from "./navigating/goto";
import type { Thrust } from "./navigating/thrust";
import { applyThrust, createThrust } from "./navigating/thrust";
import { flyBy } from "./navigating/flyby";
import { brake } from "./navigating/utils";

const tempPosition = new Vec2();
const tempTarget = new Vec2();

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
  entity: RequireComponent<"position">,
  v: Vec2
): Vec2 {
  const subordinates = commander.cp.subordinates.ids;
  const subordinateIndex = subordinates.findIndex(
    (subordinateId) => subordinateId === entity.id
  );
  const subordinatesCount = subordinates.length;
  const angle = commander.cp.position.angle;
  const distance = 0.1;

  const x = distance;
  const y = (subordinateIndex - (subordinatesCount - 1) / 2) * 0.12;

  return v.set(
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

  setDrive(entity: Navigable, delta: number) {
    if (!entity.cp.drive.active || delta === 0) return;
    let thrust: Thrust;

    if (!entity.cp.drive.target) {
      thrust = createThrust();
      brake(entity, 0, thrust);
    } else {
      const targetEntity = this.sim.get(entity.cp.drive.target);
      if (!targetEntity || !targetEntity.hasComponents(["position"])) {
        hold(entity);
        return;
      }

      if (
        entity.cp.drive.state === "warming" &&
        entity.cooldowns.canUse(cruiseTimer)
      ) {
        entity.cp.drive.state = "cruise";
      }

      const targetPosition = tempTarget;

      if (targetEntity.hasComponents(["drive"])) {
        getFormationPlace(
          targetEntity.requireComponents(["subordinates", "position"]),
          entity,
          targetPosition
        );
      } else {
        targetPosition.copy(targetEntity.cp.position.coord);
      }

      switch (entity.cp.drive.mode) {
        case "flyby":
          thrust = flyBy(entity, targetEntity);
          break;
        default:
          thrust = goToPosition(entity, targetPosition);
          break;
      }
    }

    applyThrust(entity, thrust, delta);
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
