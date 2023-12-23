import { manifest } from "@assets/icons";
import type { BaseComponent } from "./component";

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

export interface Render extends BaseComponent<"render"> {
  color: number;
  defaultScale: number;
  texture: keyof Textures;
  layer: Layer;
  name: "render";
  visible: boolean;
  interactive: boolean;
}

export function createRender({
  color,
  defaultScale = 1,
  texture,
  layer,
}: RenderInput): Render {
  const component: Render = {
    color: color ?? 0xffffff,
    defaultScale,
    name: "render",
    layer,
    texture,
    visible: true,
    interactive: false,
  };

  return component;
}

export function hide(render: Render) {
  render.visible = false;
}

export function show(render: Render) {
  render.visible = true;
}
