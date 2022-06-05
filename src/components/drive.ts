import { RequireComponent } from "../tsHelpers";
import { BaseComponent } from "./component";

export type Target = RequireComponent<"position">;

export interface ShipDriveProps {
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
  maneuver: number;
  cruise: number;
  /**
   * Expressed in radians per second
   */
  rotary: number;
  /**
   * Time to initiate cruise engine
   */
  ttc: number;

  state: "maneuver" | "warming" | "cruise";
  target: number | null;
  targetReached: boolean;
}

export function createDrive(input: ShipDriveProps): Drive {
  return {
    ...input,
    rotary: (input.rotary * Math.PI) / 180,
    state: "maneuver",
    target: null,
    targetReached: false,
    name: "drive",
  };
}

export function startCruise(drive: Drive) {
  drive.state = "warming";
}

export function stopCruise(drive: Drive) {
  drive.state = "maneuver";
}

export function setTarget(drive: Drive, target: number | null) {
  const shouldUpdate = target === null ? true : target !== drive.target;

  if (shouldUpdate) {
    drive.state = "maneuver";
    drive.target = target;
    drive.targetReached = false;
  }
}

export function clearTarget(drive: Drive) {
  setTarget(drive, null);
  drive.targetReached = true;
}
