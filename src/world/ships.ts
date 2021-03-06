import { DockSize } from "../components/dockable";
import { ShipDriveProps } from "../components/drive";
import { Textures } from "../components/render";
import { Commodity } from "../economy/commodity";

export const shipClasses: Array<{
  name: string;
  drive: ShipDriveProps;
  storage: number;
  mining: number;
  texture: keyof Textures;
  size: DockSize;
}> = [
  {
    name: "Courier A",
    drive: {
      cruise: 4,
      maneuver: 0.3,
      rotary: 86,
      ttc: 3,
    },
    storage: 10,
    mining: 0,
    texture: "sCiv",
    size: "small",
  },
  {
    name: "Courier B",
    drive: {
      cruise: 6,
      maneuver: 0.55,
      rotary: 117,
      ttc: 2,
    },
    storage: 6,
    mining: 0,
    texture: "sCiv",
    size: "small",
  },
  {
    name: "Freighter A",
    drive: {
      cruise: 1,
      maneuver: 0.13,
      rotary: 54,
      ttc: 3.3,
    },
    storage: 110,
    mining: 0,
    texture: "mCiv",
    size: "medium",
  },
  {
    name: "Freighter B",
    drive: {
      cruise: 0.7,
      maneuver: 0.05,
      rotary: 31,
      ttc: 6.5,
    },
    storage: 96,
    mining: 0,
    texture: "mCiv",
    size: "medium",
  },
  {
    name: "Large Freighter A",
    drive: {
      cruise: 1.1,
      maneuver: 0.1,
      rotary: 11,
      ttc: 13,
    },
    storage: 800,
    mining: 0,
    texture: "lCiv",
    size: "large",
  },
  {
    name: "Large Freighter B",
    drive: {
      cruise: 0.9,
      maneuver: 0.09,
      rotary: 9,
      ttc: 15,
    },
    storage: 940,
    mining: 0,
    texture: "lCiv",
    size: "large",
  },

  {
    name: "Miner A",
    drive: {
      cruise: 2,
      maneuver: 0.15,
      rotary: 54,
      ttc: 6,
    },
    storage: 160,
    mining: 1,
    texture: "mMin",
    size: "medium",
  },
  {
    name: "Miner B",
    drive: {
      cruise: 3,
      maneuver: 0.3,
      rotary: 68,
      ttc: 3.5,
    },
    storage: 96,
    mining: 1.4,
    texture: "mMin",
    size: "medium",
  },
];
