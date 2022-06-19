import * as PIXI from "pixi.js";
import { BaseComponent } from "./component";
import asteroidTexture from "../../assets/asteroid.svg";
import sCivTexture from "../../assets/s_civ.svg";
import mCivTexture from "../../assets/m_civ.svg";
import lCivTexture from "../../assets/l_civ.svg";
import mMinTexture from "../../assets/m_min.svg";
import fTeleportTexture from "../../assets/f_teleport.svg";
import fCivTexture from "../../assets/f_civ.svg";
import { isTest } from "../settings";

export const textures = {
  asteroid: asteroidTexture,
  sCiv: sCivTexture,
  mCiv: mCivTexture,
  lCiv: lCivTexture,
  mMin: mMinTexture,
  fTeleport: fTeleportTexture,
  fCiv: fCivTexture,
};
export type Textures = typeof textures;

export interface RenderInput {
  color?: number;
  defaultScale: number;
  maxZ: number;
  texture: keyof Textures;
  zIndex: number;
}

export class Render implements BaseComponent<"render"> {
  color: number;
  defaultScale: number = 1;
  initialized: boolean = false;
  maxZ: number;
  sprite: PIXI.Sprite;
  texture: keyof Textures;
  zIndex: number;
  name: "render" = "render";
}

export function setTexture(render: Render, texture: keyof Textures) {
  render.texture = texture;
  if (process.env.NODE_ENV !== "test") {
    render.sprite = new PIXI.Sprite(
      PIXI.Texture.from(textures[texture], {
        resolution: 2,
        resourceOptions: {
          scale: 2,
        },
      })
    );
    render.sprite.anchor.set(0.5, 0.5);
    render.sprite.zIndex = render.zIndex;
  }
}

export function createRender({
  color,
  defaultScale,
  maxZ,
  texture,
  zIndex,
}: RenderInput): Render {
  const component: Render = {
    color: color ?? 0xffffff,
    defaultScale,
    initialized: false,
    name: "render",
    zIndex,
    maxZ,
    sprite: null!,
    texture,
  };

  if (process.env.NODE_ENV !== "test") {
    setTexture(component, texture);

    if (color) {
      component.sprite.tint = color;
      component.color = color;
    }
  }

  return component;
}

export function hide(render: Render) {
  if (!isTest) {
    render.sprite.interactive = false;
    render.sprite.alpha = 0;
  }
}

export function show(render: Render) {
  if (!isTest) {
    render.sprite.interactive = true;
    render.sprite.alpha = 1;
  }
}
