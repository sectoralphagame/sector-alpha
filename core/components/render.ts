import * as PIXI from "pixi.js";
import { manifest } from "@assets/icons";
import type { BaseComponent } from "./component";
import { isHeadless } from "../settings";

export const textures = manifest.frames;
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

let spritesheet: PIXI.Spritesheet;
if (!isHeadless) {
  spritesheet = new PIXI.Spritesheet(
    PIXI.BaseTexture.from(manifest.meta.image),
    manifest
  );
  spritesheet.parse();
}

export function setTexture(render: Render, texture: keyof Textures) {
  render.texture = texture;
  if (!isHeadless) {
    render.sprite = new PIXI.Sprite(spritesheet.textures[texture]);
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
