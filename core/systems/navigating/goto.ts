import { startCruise, stopCruise } from "@core/utils/moving";
import { Vec2 } from "ogl";
import clamp from "lodash/clamp";
import type { Navigable } from "./types";
import type { Thrust } from "./thrust";
import { lateralForce } from "./thrust";
import { brake, getBrakingDistance } from "./utils";

const tempVelocity = new Vec2();
const tempForwardThrust = new Vec2();
const tempLateralThrust = new Vec2();
const tempForward = new Vec2();
const tempVec2 = new Vec2();

export function goToPosition(entity: Navigable, target: Vec2): Thrust {
  const distanceToTarget = target.distance(entity.cp.position.coord);
  const speed = entity.cp.movable.velocity.len();
  const speedPercent =
    speed /
    (entity.cp.drive.state === "cruise"
      ? entity.cp.drive.cruise
      : entity.cp.drive.maneuver);
  const forward = tempForward.set(
    Math.cos(entity.cp.position.angle),
    Math.sin(entity.cp.position.angle)
  );
  const thrust: Thrust = {
    forward: tempForwardThrust
      .copy(target)
      .sub(entity.cp.position.coord)
      .normalize(),
    lateral: tempLateralThrust.set(0),
    throttle: 1,
    drag: 0,
    angular: 1,
  };

  const alignmentToTarget = forward.dot(thrust.forward);
  const alignmentToVelocity =
    speed > 0
      ? forward.dot(tempVelocity.copy(entity.cp.movable.velocity).normalize())
      : 1;
  const forwardMag = forward.dot(entity.cp.movable.velocity);

  thrust.angular =
    (Math.min(1, 1 - speedPercent + 0.5) * (alignmentToTarget + 1)) / 2;
  thrust.drag = Math.min(0.7, (1 - alignmentToTarget) ** 2);
  if (speed > 0) {
    thrust.lateral
      .copy(entity.cp.movable.velocity)
      .sub(tempVec2.copy(forward).multiply(forwardMag))
      .normalize();
  }

  if (alignmentToTarget < 0.8) {
    thrust.throttle = clamp(
      ((alignmentToVelocity + 1) / 2) * speedPercent,
      0,
      1
    );
  }

  if (
    entity.cp.drive.state === "maneuver" &&
    alignmentToTarget > 0.95 &&
    entity.cooldowns.canUse("cruise") &&
    distanceToTarget < entity.cp.drive.cruise * entity.cp.drive.ttc * 3
  ) {
    startCruise(entity);
  }
  if (distanceToTarget < entity.cp.drive.maneuver * 2) {
    stopCruise(entity);
  }

  if (speed > 0) {
    if (
      (distanceToTarget < getBrakingDistance(entity) / lateralForce &&
        entity.cp.drive.mode !== "flyby") ||
      distanceToTarget < entity.cp.drive.minimalDistance
    ) {
      brake(entity, 0, thrust);
    } else if (alignmentToVelocity > 0.2 && alignmentToTarget < 0.2) {
      brake(entity, (1 + alignmentToTarget) / 10, thrust);
    } else if (alignmentToTarget < 0.4) {
      brake(entity, 0, thrust);
    }
  }

  return thrust;
}
