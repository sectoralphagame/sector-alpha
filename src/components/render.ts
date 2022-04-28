import * as PIXI from "pixi.js";

export class Render {
  defaultScale: number = 1;
  initialized: boolean = false;
  maxZ: number;
  sprite: PIXI.Sprite;
  texture: string;

  constructor(
    pathToTexture: string,
    maxZ: number,
    color: number = null,
    defaultScale = 1
  ) {
    this.defaultScale = defaultScale;
    this.texture = pathToTexture;
    this.maxZ = maxZ;

    if (process.env.NODE_ENV !== "test") {
      this.sprite = new PIXI.Sprite(PIXI.Texture.from(pathToTexture));
      this.sprite.anchor.set(0.5, 0.5);
      if (color) {
        this.sprite.tint = color;
      }
    }
  }
}
