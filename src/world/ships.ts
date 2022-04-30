import sCivTexture from "../../assets/s_civ.svg";
import mCivTexture from "../../assets/m_civ.svg";
import lCivTexture from "../../assets/l_civ.svg";
import mMinTexture from "../../assets/m_min.svg";

export const shipClasses = {
  courierA: {
    name: "Courier A",
    drive: {
      cruise: 4,
      maneuver: 0.3,
      rotary: 86,
      ttc: 3,
    },
    storage: 10,
    mining: 0,
    texture: sCivTexture,
  },
  courierB: {
    name: "Courier B",
    drive: {
      cruise: 6,
      maneuver: 0.55,
      rotary: 117,
      ttc: 2,
    },
    storage: 6,
    mining: 0,
    texture: sCivTexture,
  },
  freighterA: {
    name: "Freighter A",
    drive: {
      cruise: 1,
      maneuver: 0.13,
      rotary: 54,
      ttc: 3.3,
    },
    storage: 110,
    mining: 0,
    texture: mCivTexture,
  },
  freighterB: {
    name: "Freighter B",
    drive: {
      cruise: 0.7,
      maneuver: 0.05,
      rotary: 31,
      ttc: 6.5,
    },
    storage: 96,
    mining: 0,
    texture: mCivTexture,
  },

  minerA: {
    name: "Miner A",
    drive: {
      cruise: 2,
      maneuver: 0.15,
      rotary: 54,
      ttc: 6,
    },
    storage: 160,
    mining: 1,
    texture: mMinTexture,
  },
  minerB: {
    name: "Miner B",
    drive: {
      cruise: 3,
      maneuver: 0.3,
      rotary: 68,
      ttc: 3.5,
    },
    storage: 96,
    mining: 1.4,
    texture: mMinTexture,
  },
};
