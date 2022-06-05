import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import { Cooldowns } from "../utils/cooldowns";
import { Entity } from "./entity";

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

export class Drive {
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

  cooldowns = new Cooldowns("cruise");
  state: "maneuver" | "warming" | "cruise" = "maneuver";
  target: Target = null;
  targetId: number | null;
  targetReached: boolean = false;

  constructor(input: ShipDriveProps) {
    this.cruise = input.cruise;
    this.maneuver = input.maneuver;
    this.rotary = (input.rotary * Math.PI) / 180;
    this.ttc = input.ttc;
  }

  load = (sim: Sim) => {
    if (this.targetId) {
      this.target = sim.entities.find(
        (e) => e.id === this.targetId
      ) as RequireComponent<"position">;
    }
  };

  startCruise = () => {
    if (this.state === "maneuver") {
      this.cooldowns.use("cruise", this.ttc);
      this.state = "warming";
    }
  };

  stopCruise = () => {
    this.state = "maneuver";
  };

  sim = (delta: number) => {
    this.cooldowns.update(delta);

    if (this.state === "warming") {
      if (this.cooldowns.canUse("cruise")) {
        this.state = "cruise";
      }
    }
  };

  setTarget = (target: Target) => {
    const targetsAreEntities =
      target instanceof Entity && this.target instanceof Entity;

    const shouldUpdate = targetsAreEntities
      ? target.id !== (this.target as Entity).id
      : true;

    if (shouldUpdate) {
      this.state = "maneuver";
      this.target = target;
      this.targetReached = false;

      if (target instanceof Entity) {
        this.targetId = target.id;
      } else {
        this.targetId = null;
      }
    }
  };

  clearTarget = () => {
    this.setTarget(null);
    this.targetReached = true;
  };
}
