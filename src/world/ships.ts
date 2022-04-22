import { matrix } from "mathjs";
import { InitialShipInput } from "../entities/ship";

export const shipClasses: Record<
  "shipA" | "shipB" | "minerA" | "minerB",
  InitialShipInput
> = {
  shipA: {
    name: "Ship Type A",
    position: matrix([0, 0]),
    drive: {
      cruise: 4,
      maneuver: 0.3,
      ttc: 3,
    },
    storage: 10,
    mining: 0,
  },
  shipB: {
    name: "Ship Type B",
    position: matrix([0, 0]),
    drive: {
      cruise: 4.6,
      maneuver: 0.55,
      ttc: 2,
    },
    storage: 6,
    mining: 0,
  },

  minerA: {
    name: "Mining Ship Type A",
    position: matrix([0, 0]),
    drive: {
      cruise: 3,
      maneuver: 0.2,
      ttc: 6,
    },
    storage: 40,
    mining: 1,
  },
  minerB: {
    name: "Mining Ship Type B",
    position: matrix([0, 0]),
    drive: {
      cruise: 4,
      maneuver: 0.5,
      ttc: 3.5,
    },
    storage: 24,
    mining: 1.3,
  },
};
