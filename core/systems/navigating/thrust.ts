import clamp from "lodash/clamp";
import { Vec2 } from "ogl";
import type { Navigable } from "./types";
import { getDeltaAngle } from "./utils";

export const lateralForce = 0.35;

export interface Thrust {
  forward: Vec2;
  lateral: Vec2;
  throttle: number;
  drag: number;
  angular: number;
}

const tempForward = new Vec2();

export function applyThrust(entity: Navigable, thrust: Thrust, delta: number) {
  const forward = tempForward.set(
    Math.cos(entity.cp.position.angle),
    Math.sin(entity.cp.position.angle)
  );
  const cross = forward.x * thrust.forward.y - forward.y * thrust.forward.x;
  const dot = forward.dot(thrust.forward);
  const angleToTarget = Math.atan2(cross, dot);
  entity.cp.movable.rotary = getDeltaAngle(
    angleToTarget,
    entity.cp.drive.rotary * clamp(thrust.angular, 0.2, 1),
    delta
  );

  entity.cp.movable.acceleration
    .copy(forward)
    .normalize()
    .multiply(entity.cp.drive.acceleration * clamp(thrust.throttle, 0, 1))
    .sub(thrust.lateral.multiply(entity.cp.drive.acceleration * lateralForce));
  entity.cp.movable.drag = clamp(thrust.drag, 0, 1);
}
