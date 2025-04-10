import { limitMax } from "@core/utils/limit";
import { gameMonth } from "@core/utils/misc";
import type { ShipInput } from "@core/world/ships";

export type FormData = { ships: ShipInput[] };

/**
 * Expressed in seconds
 */
export function getShipTravelTime(ship: ShipInput, distance: number): number {
  if (
    [ship.acceleration, ship.cruise, ship.maneuver].some(
      (v) => Number.isNaN(v) || v <= 0
    )
  ) {
    return NaN;
  }

  const resolution = distance / 100;
  let moved = 0;
  let speed = 0;
  let cycles = 0;

  // Inspired by Verlet integration
  for (; moved < distance && cycles * resolution < ship.ttc; cycles++) {
    moved += speed * resolution;
    speed = limitMax(
      speed + ship.maneuver * ship.acceleration * resolution,
      ship.maneuver
    );
  }

  for (; moved < distance; cycles++) {
    moved += speed * resolution;
    speed = limitMax(
      speed + ship.cruise * ship.acceleration * resolution,
      ship.cruise
    );
  }

  return cycles * resolution;
}

/**
 * Expressed in units per second
 */
export function getShipTravelSpeed(ship: ShipInput, distance: number): number {
  return distance / getShipTravelTime(ship, distance);
}

/**
 * Expressed in storage kilounits per hour
 */
export function getShipStorageEfficiency(
  ship: ShipInput,
  distance: number
): number {
  return (ship.storage / getShipTravelTime(ship, distance)) * gameMonth;
}

/**
 * Expressed in storage kilounits per hour
 */
export function getShipMiningEfficiency(
  ship: ShipInput,
  distance: number
): number {
  if (ship.mining === 0) {
    return 0;
  }

  return (
    (ship.storage /
      (getShipTravelTime(ship, distance) * 2 + ship.storage / ship.mining)) *
    gameMonth
  );
}

// eslint-disable-next-line no-unused-vars
export function withDistance(cb: (distance: number) => any): string {
  return [10, 100, 1000, 10000].map(cb).join(" / ");
}
