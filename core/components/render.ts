import * as PIXI from "pixi.js";
import asteroidTexture from "@assets/icons/asteroid.svg";
import sCivTexture from "@assets/icons/s_civ.svg";
import mCivTexture from "@assets/icons/m_civ.svg";
import lCivTexture from "@assets/icons/l_civ.svg";
import mMinTexture from "@assets/icons/m_min.svg";
import fMinTexture from "@assets/icons/f_min.svg";
import lMilTexture from "@assets/icons/l_mil.svg";
import lMinTexture from "@assets/icons/l_min.svg";
import mMilTexture from "@assets/icons/m_mil.svg";
import sMilTexture from "@assets/icons/s_mil.svg";
import fTeleportTexture from "@assets/icons/f_teleport.svg";
import fCivTexture from "@assets/icons/f_civ.svg";
import fFactoryTexture from "@assets/icons/f_factory.svg";
import fShipyardTexture from "@assets/icons/f_shipyard.svg";
import lBuilderTexture from "@assets/icons/l_bld.svg";
import boxTexture from "@assets/icons/box.svg";
import lStorageTexture from "@assets/icons/l_stg.svg";
import type { BaseComponent } from "./component";
import { isHeadless } from "../settings";

export const textures = {
  asteroid: asteroidTexture,
  box: boxTexture,
  fCiv: fCivTexture,
  fFactory: fFactoryTexture,
  fMin: fMinTexture,
  fShipyard: fShipyardTexture,
  fTeleport: fTeleportTexture,
  lBuilder: lBuilderTexture,
  lCiv: lCivTexture,
  lMil: lMilTexture,
  lMin: lMinTexture,
  lStorage: lStorageTexture,
  mCiv: mCivTexture,
  mMil: mMilTexture,
  mMin: mMinTexture,
  sCiv: sCivTexture,
  sMil: sMilTexture,
};
export type Textures = typeof textures;
export type Layer =
  | "facility"
  | "ship"
  | "global"
  | "selection"
  | "collectible";

export interface RenderInput {
  color?: number;
  defaultScale: number;
  texture: keyof Textures;
  layer: Layer;
}

export class Render implements BaseComponent<"render"> {
  color: number;
  defaultScale: number = 1;
  initialized: boolean = false;
  sprite: PIXI.Sprite;
  texture: keyof Textures;
  layer: Layer;
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
  }
}

export function destroy(render: Render) {
  render.sprite.destroy();
}

export function createRender({
  color,
  defaultScale,
  texture,
  layer,
}: RenderInput): Render {
  const component: Render = {
    color: color ?? 0xffffff,
    defaultScale,
    initialized: false,
    name: "render",
    layer,
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
