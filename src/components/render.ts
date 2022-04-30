import * as PIXI from "pixi.js";

export interface RenderInput {
  color?: number;
  defaultScale: number;
  maxZ: number;
  pathToTexture: string;
  zIndex: number;
}

export class Render {
  defaultScale: number = 1;
  initialized: boolean = false;
  maxZ: number;
  sprite: PIXI.Sprite;
  texture: string;

  constructor({
    color,
    defaultScale,
    maxZ,
    pathToTexture,
    zIndex,
  }: RenderInput) {
    this.defaultScale = defaultScale;
    this.texture = pathToTexture;
    this.maxZ = maxZ;

    if (process.env.NODE_ENV !== "test") {
      this.sprite = new PIXI.Sprite(
        PIXI.Texture.from(pathToTexture, {
          resolution: 2,
          resourceOptions: {
            scale: 2,
          },
        })
      );
      this.sprite.anchor.set(0.5, 0.5);
      this.sprite.zIndex = zIndex;
      if (color) {
        this.sprite.tint = color;
      }
    }
  }
}
