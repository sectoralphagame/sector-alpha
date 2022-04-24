import { Cooldowns } from "../utils/cooldowns";

export interface ShipDriveProps {
  maneuver: number;
  cruise: number;
  /**
   * Time to initiate cruise engine
   */
  ttc: number;
}

export class ShipDrive {
  maneuver: number;
  cruise: number;
  /**
   * Time to initiate cruise engine
   */
  ttc: number;

  cooldowns = new Cooldowns("cruise");
  state: "maneuver" | "warming" | "cruise" = "maneuver";

  constructor(input: ShipDriveProps) {
    this.cruise = input.cruise;
    this.maneuver = input.maneuver;
    this.ttc = input.ttc;
  }

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
}
