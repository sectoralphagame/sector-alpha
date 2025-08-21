import { startCruise, stopCruise } from "@core/utils/moving";
import { Vec2 } from "ogl";
import clamp from "lodash/clamp";
import type { RequireComponent } from "@core/tsHelpers";
import { getPane } from "@ui/context/Pane";
import type { Navigable } from "./types";
import { createThrust, type Thrust } from "./thrust";
import { brake } from "./utils";

const tempVelocity = new Vec2();
const tempForward = new Vec2();
const tempVec2 = new Vec2();
const tempTargetDirection = new Vec2();

export function flyBy(
  entity: Navigable,
  target: RequireComponent<"position">
): Thrust {
  const targetPosition = target.cp.position.coord;
  const distanceToTarget = targetPosition.distance(entity.cp.position.coord);
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
  const targetForward = tempTargetDirection.set(
    Math.cos(target.cp.position.angle),
    Math.sin(target.cp.position.angle)
  );
  const thrust = createThrust();
  thrust.forward.copy(targetPosition).sub(entity.cp.position.coord).normalize();

  const alignmentToTarget = forward.dot(thrust.forward);
  const alignmentToVelocity =
    speed > 0
      ? forward.dot(tempVelocity.copy(entity.cp.movable.velocity).normalize())
      : 1;
  const alignmentToTargetForward = forward.dot(targetForward);
  const forwardMag = forward.dot(entity.cp.movable.velocity);

  thrust.angular =
    (Math.min(1, 1 - speedPercent + 0.5) * (alignmentToTarget + 1)) / 2;
  thrust.drag = Math.min(0.7, (1 - alignmentToTarget) ** 2);

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
    thrust.lateral
      .copy(entity.cp.movable.velocity)
      .sub(tempVec2.copy(forward).multiply(forwardMag))
      .normalize();

    if (
      alignmentToVelocity > 0.2 &&
      (entity.cp.hitpoints?.shield?.value ?? 1) /
        (entity.cp.hitpoints?.shield?.max ?? 1) <=
        0.5
    ) {
      if (window.selected === entity)
        getPane().updateDebugValue({ name: "thrust", data: "fallback" });
      thrust.forward.negate();
      thrust.throttle = 1;
    } else if (alignmentToTarget < 0.4 && alignmentToTargetForward > 0.5) {
      if (window.selected === entity)
        getPane().updateDebugValue({ name: "thrust", data: "braking" });
      brake(entity, 0, thrust);
    } else if (alignmentToVelocity < 0) {
      if (window.selected === entity)
        getPane().updateDebugValue({ name: "thrust", data: "misaligned" });
      brake(entity, 0, thrust);
    } else if (window.selected === entity)
      getPane().updateDebugValue({ name: "thrust", data: "forward" });
  }

  return thrust;
}
