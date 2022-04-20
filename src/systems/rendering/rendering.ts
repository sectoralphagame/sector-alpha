import P5 from "p5";
import { Sim } from "../../sim";
import "./components/Panel";
import * as PIXI from "pixi.js";
import { SVGScene } from "@pixi-essentials/svg";
import { Viewport } from "pixi-viewport";
import { System } from "../system";
import f_civ from "../../../assets/f_shipyard.svg";
import s_civ from "../../../assets/s_civ.svg";
import { Query } from "../query";

export class RenderingSystem extends System {
  renderable: Query<"render" | "position">;
  selectable: Query<"selection" | "position">;
  parent: Element;
  p5: P5;

  constructor(sim: Sim) {
    super(sim);
    this.parent = document.querySelector("#canvasRoot");
    this.renderable = new Query(sim, ["render", "position"]);
    this.selectable = new Query(sim, ["selection", "position"]);

    this.init();
  }

  init = () => {
    let selected = null;

    const app = new PIXI.Application({
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio,
      width: window.innerWidth,
      height: window.innerHeight,
      view: root,
    });

    const viewport = new Viewport({
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      interaction: app.renderer.plugins.interaction,
    });

    app.stage.addChild(viewport);

    viewport.drag().pinch().wheel();

    const textures = {
      sCiv: PIXI.Texture.from(s_civ),
      fCiv: PIXI.Texture.from(f_civ),
    };

    const sprite = new PIXI.Sprite(textures.sCiv);
    sprite.tint = 0xff0;
    sprite.anchor.set(0.5);
    sprite.position.set(500, 500);
    sprite.scale.set(0.8);

    viewport.addChild(sprite);

    const spriteF = new PIXI.Sprite(textures.fCiv);
    spriteF.tint = 0xff0;
    spriteF.anchor.set(0.5);
    spriteF.position.set(600, 500);
    spriteF.interactive = true;
    spriteF.scale.set(1.5);

    spriteF.on("pointerover", () => {
      console.log("oh");
      selected = 1;
    });
    spriteF.on("pointerout", () => {
      selected = null;
    });

    app.ticker.add(() => {
      if (selected) {
        spriteF.scale.set(
          spriteF.scale.x + (spriteF.scale.x > 1.9 ? -0.02 : 0.01)
        );
      } else {
        spriteF.scale.set(1.5);
      }
    });

    viewport.addChild(spriteF);
  };

  // eslint-disable-next-line no-unused-vars, class-methods-use-this
  exec(): void {}
}
