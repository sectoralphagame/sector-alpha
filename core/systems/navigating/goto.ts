import { startCruise, stopCruise } from "@core/utils/moving";
import { Vec2 } from "ogl";
import clamp from "lodash/clamp";
import type { DockSize } from "@core/components/dockable";
import type { Navigable } from "./types";
import type { Thrust } from "./thrust";
import { createThrust, lateralForce } from "./thrust";
import { brake, getBrakingDistance } from "./utils";

const tempVelocity = new Vec2();
const tempForward = new Vec2();
const tempVec2 = new Vec2();

const brakeAlignment: Record<DockSize, number> = {
  large: 0.95,
  medium: 0.8,
  small: 0.4,
};

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
  const thrust = createThrust();
  thrust.forward.copy(target).sub(entity.cp.position.coord).normalize();

  const alignmentToTarget = forward.dot(thrust.forward);
  const alignmentToVelocity =
    speed > 0
      ? forward.dot(tempVelocity.copy(entity.cp.movable.velocity).normalize())
      : 1;
  const forwardMag = forward.dot(entity.cp.movable.velocity);

  const speedCoeff = Math.min(1, 1 - speedPercent + 0.5);
  const alignCoeff = (1 - (alignmentToTarget + 1) / 2) ** 2 + 0.2;
  thrust.angular = speedCoeff * alignCoeff;
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
      distanceToTarget < getBrakingDistance(entity) / lateralForce ||
      distanceToTarget < entity.cp.drive.minimalDistance
    ) {
      brake(entity, 0, thrust);
    } else if (alignmentToVelocity > 0.2 && alignmentToTarget < 0.2) {
      brake(entity, (1 + alignmentToTarget) / 10, thrust);
    } else if (
      alignmentToTarget < brakeAlignment[entity.cp.dockable?.size ?? "large"]
    ) {
      brake(entity, 0, thrust);
    }
  }

  return thrust;
}
