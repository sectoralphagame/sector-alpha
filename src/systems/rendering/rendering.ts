import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
import Color from "color";
import { drawGraphics } from "../../components/renderGraphics";
import { RequireComponent } from "../../tsHelpers";
import { Cooldowns } from "../../utils/cooldowns";
import { SystemWithHooks } from "../hooks";
import { clearFocus } from "../../components/selection";
import { setTexture } from "../../components/render";

const minScale = 0.05;

export class RenderingSystem extends SystemWithHooks {
  rendering: true;
  selectionManger: RequireComponent<"selectionManager">;
  viewport: Viewport;
  app: PIXI.Application;
  initialized = false;
  resizeObserver: ResizeObserver;
  cooldowns: Cooldowns<"graphics">;
  dragging: boolean = false;

  init = () => {
    this.cooldowns = new Cooldowns("graphics");
    this.selectionManger = this.sim.queries.settings.get()[0];
    const root = document.querySelector("#root")!;
    const toolbar = document.querySelector("#toolbar")!;
    const canvasRoot = document.querySelector(
      "#canvasRoot"
    )! as HTMLCanvasElement;

    if (!(root || toolbar || canvasRoot)) return;

    const canvas = document.createElement("canvas");
    canvasRoot.appendChild(canvas);

    this.app = new PIXI.Application({
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio,
      width: root.clientWidth - toolbar.clientWidth,
      height: window.innerHeight,
      view: canvas,
    });

    this.viewport = new Viewport({
      screenWidth: root.clientWidth - toolbar.clientWidth,
      screenHeight: window.innerHeight,
      interaction: this.app.renderer.plugins.interaction,
    });

    this.app.stage.addChild(this.viewport);

    this.viewport.drag().pinch().wheel();
    this.viewport.clampZoom({ minScale });
    this.viewport.on("drag-start", () => {
      this.selectionManger.cp.selectionManager.focused = false;
      this.viewport.plugins.remove("follow");
      this.dragging = true;
    });
    this.viewport.on("drag-end", () => {
      this.dragging = false;
    });

    this.viewport.on("mouseup", (event) => {
      if (event.target === event.currentTarget && !this.dragging) {
        clearFocus(this.selectionManger.cp.selectionManager);
      }
    });
    this.viewport.sortableChildren = true;

    this.resizeObserver = new ResizeObserver(() => {
      this.app.resizeTo = canvasRoot;
      this.viewport.resize(
        root.clientWidth - toolbar.clientWidth,
        window.innerHeight
      );
    });
    this.resizeObserver.observe(toolbar);

    this.sim.entities.forEach((entity) => {
      if (entity.cp.render) {
        setTexture(entity.cp.render, entity.cp.render.texture);
        entity.cp.render.initialized = false;
      }
      if (entity.cp.renderGraphics) {
        entity.cp.renderGraphics.g = new PIXI.Graphics();
        entity.cp.renderGraphics.initialized = false;
      }
    });

    this.initialized = true;
  };

  destroy(): void {
    this.resizeObserver.disconnect();
    this.viewport.destroy();
    this.app.destroy(true);
  }

  updateGraphics = () => {
    if (this.cooldowns.canUse("graphics")) {
      this.cooldowns.use("graphics", this.sim.speed);
      this.sim.queries.renderableGraphics.get().forEach((entity) => {
        if (
          entity.cp.renderGraphics.redraw ||
          !entity.cp.renderGraphics.initialized
        ) {
          drawGraphics(entity, this.viewport);
        }
      });
    }
  };

  updateRenderables = () => {
    this.sim.queries.renderable.get().forEach((entity) => {
      const entityRender = entity.cp.render;
      const scale = this.viewport.scale.x;

      if (!entityRender.initialized) {
        this.viewport.addChild(entityRender.sprite);
        if (entity.hasComponents(["selection"])) {
          entityRender.sprite.interactive = true;
          entityRender.sprite.on("pointerdown", () => {
            this.selectionManger.cp.selectionManager.id = entity.id;
          });
          entityRender.sprite.cursor = "pointer";
          entityRender.sprite.tint = entityRender.color;
          entityRender.sprite.zIndex = entityRender.zIndex;
          entityRender.sprite.visible = entityRender.maxZ <= scale;
        }

        this.updateEntityScaling(entity);
        entityRender.initialized = true;
        entity.cp.position.moved = true;
      }

      if (entity.cp.position.moved) {
        entity.cp.position.moved = false;

        entityRender.sprite.position.set(
          entity.cp.position.coord.get([0]) * 10,
          entity.cp.position.coord.get([1]) * 10
        );
        entityRender.sprite.rotation = entity.cp.position.angle;
      }
    });
  };

  updateSelection = () => {
    this.sim.queries.renderable.get().forEach((entity) => {
      const entityRender = entity.cp.render;
      const selected =
        entity.id === this.selectionManger.cp.selectionManager.id;

      if (selected && entityRender.sprite.tint === entityRender.color) {
        entityRender.sprite.tint = Color(entityRender.sprite.tint)
          .lighten(0.23)
          .rgbNumber();
        entityRender.sprite.zIndex = 10;
      } else if (!selected && entityRender.sprite.tint !== entityRender.color) {
        entityRender.sprite.tint = entityRender.color;
        entityRender.sprite.zIndex = entityRender.zIndex;
      }
    });
    this.updateScaling();
  };

  updateEntityScaling = (entity: RequireComponent<"render">) => {
    const entityRender = entity.cp.render;
    const selected = entity.id === this.selectionManger.cp.selectionManager.id;
    const scale = this.viewport.scale.x;

    entityRender.sprite.scale.set(
      (1 / (scale * (scale < entityRender.maxZ * 2 ? 2 : 1))) *
        entityRender.defaultScale *
        (selected ? 1.5 : 1)
    );

    entityRender.sprite.visible = entityRender.maxZ <= scale;
  };

  updateScaling = () => {
    this.sim.queries.renderable.get().forEach(this.updateEntityScaling);
  };

  exec = (delta: number): void => {
    super.exec(delta);
    if (!this.initialized) {
      this.init();
      return;
    }
    this.cooldowns.update(delta);
    this.selectionManger = this.sim.queries.settings.get()[0];

    this.updateGraphics();
    this.updateRenderables();

    this.hook(
      this.selectionManger.cp.selectionManager.id,
      this.updateSelection
    );
    this.hook(this.viewport.scale.x, this.updateScaling);

    if (this.selectionManger.cp.selectionManager.focused) {
      const entity = this.sim.getOrThrow(
        this.selectionManger.cp.selectionManager.id!
      );
      if (entity.hasComponents(["render"])) {
        this.viewport.follow(
          entity.requireComponents(["render"]).cp.render.sprite
        );
      } else {
        this.selectionManger.cp.selectionManager.focused = false;
      }
    }
  };
}
