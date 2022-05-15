import P5 from "p5";
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
import Color from "color";
import { Sim } from "../../sim";
import { System } from "../system";

if (process.env.NODE_ENV !== "test") {
  // eslint-disable-next-line global-require
  require("./components/Panel");
}

const minScale = 0.2;

export class RenderingSystem extends System {
  viewport: Viewport;
  p5: P5;
  prevScale: number = minScale;

  constructor(sim: Sim) {
    super(sim);

    this.init();
  }

  init = () => {
    const settingsEntity = this.sim.queries.selectionManager.get()[0];
    const root = document.querySelector("#root")!;
    const toolbar = document.querySelector("#toolbar")!;
    const canvas = document.querySelector("#canvasRoot")! as HTMLCanvasElement;

    const app = new PIXI.Application({
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio,
      width: root.clientWidth - toolbar.clientWidth,
      height: window.innerHeight,
      view: canvas,
    });

    const viewport = new Viewport({
      screenWidth: root.clientWidth - toolbar.clientWidth,
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
    viewport.sortableChildren = true;

    this.viewport = viewport;
  };

  exec(): void {
    const settingsEntity = this.sim.queries.selectionManager.get()[0];

    this.sim.queries.sectors.get().forEach((sector) => {
      if (!sector.cp.renderGraphics.initialized) {
        sector.cp.renderGraphics.draw(this.viewport);
        sector.cp.renderGraphics.initialized = true;
      }
    });

    this.sim.queries.renderableGraphics.get().forEach((entity) => {
      if (!entity.cp.renderGraphics.initialized) {
        entity.cp.renderGraphics.draw(this.viewport);
        entity.cp.renderGraphics.initialized = true;
      }
    });

    this.sim.queries.renderable.get().forEach((entity) => {
      const entityRender = entity.cp.render;
      const selected = entity === settingsEntity.cp.selectionManager.entity;

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
      entityRender.sprite.rotation = entity.cp.position.angle;
      if (selected && entityRender.sprite.tint === entityRender.color) {
        entityRender.sprite.tint = Color(entityRender.sprite.tint)
          .lighten(0.23)
          .rgbNumber();
        entityRender.sprite.zIndex = 10;
      } else if (!selected && entityRender.sprite.tint !== entityRender.color) {
        entityRender.sprite.tint = entityRender.color;
        entityRender.sprite.zIndex = entityRender.zIndex;
      }

      entityRender.sprite.scale.set(
        (1 / this.prevScale) * entityRender.defaultScale * (selected ? 1.5 : 1)
      );

      entityRender.sprite.visible = entityRender.maxZ <= this.prevScale;
    });

    if (settingsEntity.cp.selectionManager.focused) {
      this.viewport.follow(
        settingsEntity.cp.selectionManager.entity!.requireComponents(["render"])
          .cp.render.sprite
      );
    }

    this.prevScale = this.viewport.scale.x;
  }
}
