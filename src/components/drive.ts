import { RequireComponent } from "../tsHelpers";
import { BaseComponent } from "./component";
import { Entity } from "./entity";
import { EntityId } from "./utils/entityId";

export type Target = RequireComponent<"position"> | null;

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

export interface Drive extends BaseComponent<"drive">, EntityId<Target> {
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
  targetReached: boolean;
}

export function createDrive(input: ShipDriveProps): Drive {
  return {
    ...input,
    rotary: (input.rotary * Math.PI) / 180,
    state: "maneuver",
    entity: null,
    entityId: null,
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

export function setTarget(drive: Drive, target: Target) {
  const targetsAreEntities =
    target instanceof Entity && drive.entity instanceof Entity;

  const shouldUpdate = targetsAreEntities
    ? target.id !== (drive.entity as Entity).id
    : true;

  if (shouldUpdate) {
    drive.state = "maneuver";
    drive.entity = target;
    drive.targetReached = false;

    if (target instanceof Entity) {
      drive.entityId = target.id;
    } else {
      drive.entityId = null;
    }
  }
}

export function clearTarget(drive: Drive) {
  setTarget(drive, null);
  drive.targetReached = true;
}
