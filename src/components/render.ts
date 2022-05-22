import * as PIXI from "pixi.js";
import { BaseComponent } from "./component";

export interface RenderInput {
  color?: number;
  defaultScale: number;
  maxZ: number;
  pathToTexture: string;
  zIndex: number;
}

export class Render implements BaseComponent<"render"> {
  color: number;
  defaultScale: number = 1;
  initialized: boolean = false;
  maxZ: number;
  sprite: PIXI.Sprite;
  texture: string;
  zIndex: number;
  name: "render" = "render";

  constructor({
    color,
    defaultScale,
    maxZ,
    pathToTexture,
    zIndex,
  }: RenderInput) {
    this.defaultScale = defaultScale;
    this.zIndex = zIndex;
    this.maxZ = maxZ;

    if (process.env.NODE_ENV !== "test") {
      this.setTexture(pathToTexture);

      if (color) {
        this.sprite.tint = color;
        this.color = color;
      }
    }
  }

  setTexture = (pathToTexture: string) => {
    this.texture = pathToTexture;
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
      this.sprite.zIndex = this.zIndex;
    }
  };

  hide = () => {
    this.sprite.interactive = false;
    this.sprite.alpha = 0;
  };

  show = () => {
    this.sprite.interactive = true;
    this.sprite.alpha = 1;
  };
}

export class RenderGraphics implements BaseComponent<"renderGraphics"> {
  // eslint-disable-next-line no-unused-vars
  _draw: (g: PIXI.Graphics) => void;
  g: PIXI.Graphics;
  initialized: boolean = false;
  name: "renderGraphics" = "renderGraphics";

  // eslint-disable-next-line no-unused-vars
  constructor(draw: (g: PIXI.Graphics) => void) {
    // eslint-disable-next-line no-underscore-dangle
    this._draw = draw;
    this.g = new PIXI.Graphics();
  }

  draw = (container: PIXI.Container) => {
    container.addChild(this.g);
    // eslint-disable-next-line no-underscore-dangle
    this._draw(this.g);
  };
}
