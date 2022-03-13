import { matrix } from "mathjs";
import { InitialShipInput } from "../entities/ship";

export const shipClasses: Record<"shipA" | "shipB", InitialShipInput> = {
  shipA: {
    name: "Ship Type A",
    position: matrix([0, 0]),
    speed: 1,
    storage: 10,
  },
  shipB: {
    name: "Ship Type B",
    position: matrix([0, 0]),
    speed: 1.3,
    storage: 6,
  },
};
