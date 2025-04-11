import type { RequireComponent } from "../tsHelpers";
import type { BaseComponent } from "./component";

export type Target = RequireComponent<"position">;

export interface ShipDriveProps {
  /**
   * Expressed in percent of max speed per second
   */
  acceleration: number;
  maneuver: number;
  cruise: number;
  /**
   * Expressed in degrees per second
   */
  rotary: number;
  /**
   * Time to initiate cruise engine
   */
  ttc: number;
}

export interface Drive extends BaseComponent<"drive"> {
  active: boolean;
  /** Expressed in percent of max speed per second */
  acceleration: number;
  maneuver: number;
  cruise: number;
  /** Expressed in radians per second */
  rotary: number;
  /** Time to initiate cruise engine */
  ttc: number;

  state: "maneuver" | "warming" | "cruise";
  target: number | null;
  /** Minimal distance to target to assume target was reached */
  minimalDistance: number;
  /** Limits maximum speed */
  limit: number;
  mode: "goto" | "follow" | "flyby";
}

export const defaultDriveLimit = 2000;

export function createDrive(input: ShipDriveProps): Drive {
  return {
    ...input,
    active: true,
    rotary: (input.rotary * Math.PI) / 180,
    state: "maneuver",
    target: null,
    name: "drive",
    minimalDistance: 0.01,
    limit: defaultDriveLimit,
    mode: "goto",
  };
}
