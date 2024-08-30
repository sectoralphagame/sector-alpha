/* eslint-disable */
/* prettier-ignore */

import asteroid from "./asteroid.svg";
import box from "./box.svg";
import fCiv from "./f_civ.svg";
import fFactory from "./f_factory.svg";
import fHub from "./f_hub.svg";
import fMil from "./f_mil.svg";
import fMin from "./f_min.svg";
import fShipyard from "./f_shipyard.svg";
import fTeleport from "./f_teleport.svg";
import lBld from "./l_bld.svg";
import lCiv from "./l_civ.svg";
import lMil from "./l_mil.svg";
import lMin from "./l_min.svg";
import lStg from "./l_stg.svg";
import mCiv from "./m_civ.svg";
import mMil from "./m_mil.svg";
import mMin from "./m_min.svg";
import sCiv from "./s_civ.svg";
import sMil from "./s_mil.svg";
import sMin from "./s_min.svg";
import spritesheet from "./spritesheet.png";

export const manifest = {
  frames: {
    asteroid: {
      frame: { x: 0, y: 378, w: 126, h: 96 },
      src: "./assets/icons/asteroid.svg",
    },
    box: {
      frame: { x: 0, y: 0, w: 126, h: 126 },
      src: "./assets/icons/box.svg",
    },
    fCiv: {
      frame: { x: 126, y: 0, w: 126, h: 126 },
      src: "./assets/icons/f_civ.svg",
    },
    fFactory: {
      frame: { x: 0, y: 126, w: 126, h: 126 },
      src: "./assets/icons/f_factory.svg",
    },
    fHub: {
      frame: { x: 126, y: 126, w: 126, h: 126 },
      src: "./assets/icons/f_hub.svg",
    },
    fMil: {
      frame: { x: 252, y: 0, w: 126, h: 126 },
      src: "./assets/icons/f_mil.svg",
    },
    fMin: {
      frame: { x: 252, y: 126, w: 126, h: 126 },
      src: "./assets/icons/f_min.svg",
    },
    fShipyard: {
      frame: { x: 0, y: 252, w: 126, h: 126 },
      src: "./assets/icons/f_shipyard.svg",
    },
    fTeleport: {
      frame: { x: 126, y: 252, w: 126, h: 126 },
      src: "./assets/icons/f_teleport.svg",
    },
    lBld: {
      frame: { x: 479, y: 252, w: 82, h: 126 },
      src: "./assets/icons/l_bld.svg",
    },
    lCiv: {
      frame: { x: 252, y: 252, w: 101, h: 126 },
      src: "./assets/icons/l_civ.svg",
    },
    lMil: {
      frame: { x: 378, y: 0, w: 101, h: 126 },
      src: "./assets/icons/l_mil.svg",
    },
    lMin: {
      frame: { x: 378, y: 126, w: 101, h: 126 },
      src: "./assets/icons/l_min.svg",
    },
    lStg: {
      frame: { x: 580, y: 0, w: 82, h: 126 },
      src: "./assets/icons/l_stg.svg",
    },
    mCiv: {
      frame: { x: 378, y: 252, w: 101, h: 126 },
      src: "./assets/icons/m_civ.svg",
    },
    mMil: {
      frame: { x: 479, y: 0, w: 101, h: 126 },
      src: "./assets/icons/m_mil.svg",
    },
    mMin: {
      frame: { x: 479, y: 126, w: 101, h: 126 },
      src: "./assets/icons/m_min.svg",
    },
    sCiv: {
      frame: { x: 580, y: 126, w: 76, h: 126 },
      src: "./assets/icons/s_civ.svg",
    },
    sMil: {
      frame: { x: 580, y: 252, w: 76, h: 126 },
      src: "./assets/icons/s_mil.svg",
    },
    sMin: {
      frame: { x: 0, y: 474, w: 76, h: 126 },
      src: "./assets/icons/s_min.svg",
    },
  },
  meta: {
    image: spritesheet,
    format: "RGBA8888",
    size: { w: 662, h: 600 },
    scale: "4",
  },
  properties: { width: 662, height: 600 },
} as const;

export {
  asteroid,
  box,
  fCiv,
  fFactory,
  fHub,
  fMil,
  fMin,
  fShipyard,
  fTeleport,
  lBld,
  lCiv,
  lMil,
  lMin,
  lStg,
  mCiv,
  mMil,
  mMin,
  sCiv,
  sMil,
  sMin,
};
