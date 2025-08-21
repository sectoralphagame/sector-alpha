import { dragCoeff } from "../moving";
import type { Thrust } from "./thrust";
import type { Navigable } from "./types";

export function getBrakingDistance(entity: Navigable): number {
  const speed = entity.cp.movable.velocity.len();
  const acceleration = entity.cp.drive.acceleration;
  const drag = dragCoeff + entity.cp.movable.drag;

  return speed ** 2 / (2 * (acceleration - speed * drag));
}

export function brake(entity: Navigable, targetSpeed: number, thrust: Thrust) {
  const speed = entity.cp.movable.velocity.len();

  if (speed > targetSpeed) {
    thrust.lateral.copy(entity.cp.movable.velocity).normalize();
    thrust.throttle = 0;
    thrust.drag += 0.1;
  }

  return thrust;
}

export function getDeltaAngle(
  dAngle: number,
  angular: number,
  delta: number
): number {
  return angular * delta * Math.sign(dAngle);
}
