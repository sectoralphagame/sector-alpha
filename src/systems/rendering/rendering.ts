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

const minScale = 0.4;

export class RenderingSystem extends System {
  renderable: Query<"render" | "position">;
  selectable: Query<"selection" | "position">;
  parent: Element;
  viewport: Viewport;
  p5: P5;
  prevScale: number = minScale;

  constructor(sim: Sim) {
    super(sim);
    this.parent = document.querySelector("#canvasRoot");
    this.renderable = new Query(sim, ["render", "position"]);
    this.selectable = new Query(sim, ["selection", "position"]);

    this.init();
  }

  init = () => {
    const settingsEntity = this.sim.queries.selectionManager.get()[0];

    const app = new PIXI.Application({
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio,
      width: window.innerWidth,
      height: window.innerHeight,
      view: document.querySelector("#canvasRoot"),
    });

    const viewport = new Viewport({
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      interaction: app.renderer.plugins.interaction,
    });

    app.stage.addChild(viewport);

    viewport.drag().pinch().wheel();
    viewport.clampZoom({ minScale });
    viewport.on("drag-start", () => {
      settingsEntity.cp.selectionManager.focused = false;
      viewport.plugins.remove("follow");
    });

    this.viewport = viewport;

    // spriteF.on("pointerover", () => {
    //   selected = 1;
    // });
    // spriteF.on("pointerout", () => {
    //   selected = null;
    // });

    // app.ticker.add(() => {
    //   if (selected) {
    //     spriteF.scale.set(
    //       spriteF.scale.x + (spriteF.scale.x > 1.9 ? -0.02 : 0.01)
    //     );
    //   } else {
    //     spriteF.scale.set(1.5);
    //   }
    // });
  };

  // eslint-disable-next-line no-unused-vars, class-methods-use-this
  exec(): void {
    const settingsEntity = this.sim.queries.selectionManager.get()[0];

    this.sim.queries.renderable.get().forEach((entity) => {
      const entityRender = entity.cp.render;

      if (!entityRender.initialized) {
        this.viewport.addChild(entityRender.sprite);
        if (entity.hasComponents(["selection"])) {
          entityRender.sprite.interactive = true;
          entityRender.sprite.on("mousedown", () => {
            settingsEntity.cp.selectionManager.set(entity);
          });
          entityRender.sprite.cursor = "pointer";
        }
        entityRender.initialized = true;
      }

      entityRender.sprite.position.set(
        entity.cp.position.x * 10,
        entity.cp.position.y * 10
      );

      if (this.prevScale !== this.viewport.scale.x) {
        entityRender.sprite.scale.set(
          (1 / this.prevScale) * entityRender.defaultScale
        );
      }

      entityRender.sprite.visible = entityRender.maxZ <= this.prevScale;
    });

    if (settingsEntity.cp.selectionManager.focused) {
      this.viewport.follow(
        settingsEntity.cp.selectionManager.entity.cp.render.sprite
      );
    }

    this.prevScale = this.viewport.scale.x;
  }
}
