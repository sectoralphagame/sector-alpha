import * as PIXI from "pixi.js";
import type { BaseComponent } from "./component";
import asteroidTexture from "../../assets/asteroid.svg";
import sCivTexture from "../../assets/s_civ.svg";
import mCivTexture from "../../assets/m_civ.svg";
import lCivTexture from "../../assets/l_civ.svg";
import mMinTexture from "../../assets/m_min.svg";
import fTeleportTexture from "../../assets/f_teleport.svg";
import fCivTexture from "../../assets/f_civ.svg";
import fFactoryTexture from "../../assets/f_factory.svg";
import fShipyardTexture from "../../assets/f_shipyard.svg";
import lBuilderTexture from "../../assets/l_bld.svg";
import lStorageTexture from "../../assets/l_stg.svg";
import { isHeadless } from "../settings";

export const textures = {
  asteroid: asteroidTexture,
  sCiv: sCivTexture,
  mCiv: mCivTexture,
  lCiv: lCivTexture,
  mMin: mMinTexture,
  fTeleport: fTeleportTexture,
  fShipyard: fShipyardTexture,
  fCiv: fCivTexture,
  fFactory: fFactoryTexture,
  lBuilder: lBuilderTexture,
  lStorage: lStorageTexture,
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
  if (!isHeadless) {
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

export function destroy(render: Render) {
  render.sprite.destroy();
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

  if (!isHeadless) {
    setTexture(component, texture);

    if (color) {
      component.sprite.tint = color;
      component.color = color;
    }
  }

  return component;
}

export function hide(render: Render) {
  if (!isHeadless && render.sprite) {
    render.sprite.interactive = false;
    render.sprite.visible = false;
  }
}

export function show(render: Render) {
  if (!isHeadless && render.sprite) {
    render.sprite.interactive = true;
    render.sprite.visible = true;
  }
}
