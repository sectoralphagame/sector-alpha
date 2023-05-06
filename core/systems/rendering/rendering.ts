import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
import Color from "color";
import { Entity } from "@core/entity";
import type { Sim } from "@core/sim";
import { setCheat } from "@core/utils/misc";
import { isHeadless } from "@core/settings";
import {
  createRenderGraphics,
  drawGraphics,
} from "../../components/renderGraphics";
import type { RequireComponent } from "../../tsHelpers";
import { Cooldowns } from "../../utils/cooldowns";
import { SystemWithHooks } from "../utils/hooks";
import { clearFocus } from "../../components/selection";
import type { Layer } from "../../components/render";
import { destroy, setTexture } from "../../components/render";
import { SectorQuery } from "../utils/sectorQuery";
import { drawHpBars } from "./hpBars";

const minScale = 0.08;
const maxScale = 40;

const layerScaleThresholds: Partial<Record<Layer, number>> = {
  collectible: 0.6,
  facility: 0.13,
  ship: 0.4,
};

export class RenderingSystem extends SystemWithHooks {
  rendering: true;
  settingsManager: RequireComponent<"selectionManager" | "camera">;
  viewport: Viewport;
  app: PIXI.Application;
  initialized = false;
  resizeObserver: ResizeObserver;
  cooldowns: Cooldowns<"graphics">;
  dragging: boolean = false;
  keysPressed: string[] = [];
  toolbar: HTMLDivElement;
  grid: RequireComponent<"renderGraphics"> | null = null;
  layers: Record<Layer, PIXI.Container>;
  sectorQuery: SectorQuery<"render">;

  apply = (sim: Sim) => {
    super.apply(sim);
    if (!isHeadless) {
      (window as any).rendering = this;
    }

    this.sectorQuery = new SectorQuery(sim, ["render"]);
    sim.hooks.phase.render.tap(this.constructor.name, this.exec);
  };

  init = () => {
    this.cooldowns = new Cooldowns("graphics");
    this.settingsManager = this.sim.queries.settings.get()[0];
    this.toolbar = document.querySelector("#toolbar")!;
    const root = document.querySelector("#root")!;
    const canvasRoot = document.querySelector(
      "#canvasRoot"
    )! as HTMLCanvasElement;

    if (!(root || canvasRoot)) return;

    const canvas = document.createElement("canvas");
    canvasRoot.appendChild(canvas);

    this.app = new PIXI.Application({
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio,
      width: root.clientWidth,
      height: window.innerHeight,
      view: canvas,
      backgroundColor: Color("#080808").rgbNumber(),
    });

    this.viewport = new Viewport({
      screenWidth: root.clientWidth,
      screenHeight: window.innerHeight,
      events: this.app.renderer.events,
    });

    this.app.stage.addChild(this.viewport);

    this.layers = {
      facility: new PIXI.Container(),
      ship: new PIXI.Container(),
      global: new PIXI.Container(),
      selection: new PIXI.Container(),
      collectible: new PIXI.Container(),
    };

    this.layers.global.zIndex = 0;
    this.layers.collectible.zIndex = 1;
    this.layers.facility.zIndex = 2;
    this.layers.ship.zIndex = 3;
    this.layers.selection.zIndex = 100;

    Object.values(this.layers).forEach((layer) =>
      this.viewport.addChild(layer)
    );

    this.viewport.drag().pinch().wheel();
    this.viewport.clampZoom({ minScale, maxScale });
    this.viewport.on("drag-start", () => {
      this.toolbar.style.pointerEvents = "none";
      this.settingsManager.cp.selectionManager.focused = false;
      this.viewport.plugins.remove("follow");
      this.dragging = true;
    });
    this.viewport.on("drag-end", () => {
      this.dragging = false;
    });

    this.viewport.on("mouseup", (event) => {
      this.toolbar.style.pointerEvents = "unset";
      if (event.target === event.currentTarget && !this.dragging) {
        clearFocus(this.settingsManager.cp.selectionManager);
      }
    });

    window.addEventListener("keydown", (event) => {
      if (event.target !== document.body) return;

      if (!this.keysPressed.includes(event.key)) {
        this.keysPressed.push(event.key);
      }
    });

    window.addEventListener("keyup", (event) => {
      if (this.keysPressed.includes(event.key)) {
        this.keysPressed = this.keysPressed.filter((key) => key !== event.key);
      }
    });

    this.sim.hooks.removeEntity.tap("RenderingSystem", (entity: Entity) => {
      if (entity.cp.render) {
        destroy(entity.cp.render);
      }
      if (entity.cp.renderGraphics) {
        entity.cp.renderGraphics.g.destroy();
      }
      if (entity.id === this.settingsManager.cp.selectionManager.id) {
        this.settingsManager.cp.selectionManager.id = null;
      }
      if (entity.id === this.settingsManager.cp.selectionManager.secondaryId) {
        this.settingsManager.cp.selectionManager.secondaryId = null;
      }
    });

    this.viewport.sortableChildren = true;

    this.resizeObserver = new ResizeObserver(() => {
      this.app.resizeTo = canvasRoot;
      this.viewport.resize(root.clientWidth, window.innerHeight);
    });
    this.resizeObserver.observe(canvasRoot);

    setCheat("hexGrid", this.toggleGrid);

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

    this.viewport.scale.set(this.settingsManager.cp.camera.zoom);
    this.viewport.moveCenter(
      this.settingsManager.cp.camera.position[0],
      this.settingsManager.cp.camera.position[1]
    );

    this.initialized = true;
  };

  destroy = (): void => {
    this.resizeObserver.disconnect();
    this.viewport.destroy();
    this.app.destroy(true);
  };

  updateGraphics = () => {
    this.sim.queries.renderableGraphics.get().forEach((entity) => {
      if (
        entity.cp.renderGraphics.redraw ||
        !entity.cp.renderGraphics.initialized
      ) {
        if (
          entity.cp.renderGraphics.realTime ||
          this.cooldowns.canUse("graphics")
        ) {
          drawGraphics(entity, this.viewport);
        }
      }
    });

    if (this.cooldowns.canUse("graphics")) {
      this.cooldowns.use("graphics", this.sim.speed);
    }
  };

  updateRenderables = () => {
    this.sim.queries.renderable.get().forEach((entity) => {
      const entityRender = entity.cp.render;

      if (!entityRender.initialized) {
        this.viewport.addChild(entityRender.sprite);
        if (entity.tags.has("selection")) {
          entityRender.sprite.interactive = true;
          entityRender.sprite.addEventListener("pointerdown", (event) => {
            if (event.button === 0) {
              this.settingsManager.cp.selectionManager.id = entity.id;
            }
          });
          entityRender.sprite.addEventListener("rightdown", () => {
            this.settingsManager.cp.selectionManager.secondaryId = entity.id;
          });
          entityRender.sprite.cursor = "pointer";
          entityRender.sprite.tint = entityRender.color;
          this.layers[entityRender.layer].addChild(entityRender.sprite);
        }

        this.updateEntityScaling(entity);
        entityRender.initialized = true;
        entity.cp.position.moved = true;
      }

      drawHpBars(entity);

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

  updateSelection = (previousValue: number) => {
    this.settingsManager.cp.selectionManager.focused = false;
    this.viewport.plugins.remove("follow");
    const previousSelected = this.sim.get(previousValue);
    if (previousSelected?.cp.renderGraphics?.draw === "path") {
      previousSelected.cp.renderGraphics.g.destroy();
      previousSelected.removeComponent("renderGraphics");
    }

    this.sim.queries.renderable.get().forEach((entity) => {
      const entityRender = entity.cp.render;
      const selected =
        entity.id === this.settingsManager.cp.selectionManager.id;

      if (selected && entityRender.sprite.tint === entityRender.color) {
        entityRender.sprite.tint = Color(entityRender.sprite.tint)
          .lighten(0.23)
          .rgbNumber();
        entityRender.sprite.parent?.removeChild(entityRender.sprite);
        this.layers.selection.addChild(entityRender.sprite);

        if (entity.cp.orders) {
          entity.addComponent(createRenderGraphics("path"));
        }
      } else if (!selected && entityRender.sprite.tint !== entityRender.color) {
        entityRender.sprite.tint = entityRender.color;
        entityRender.sprite.parent?.removeChild(entityRender.sprite);
        this.layers[entityRender.layer].addChild(entityRender.sprite);
      }
    });
    this.updateScaling();
  };

  updateEntityScaling = (entity: RequireComponent<"render">) => {
    const entityRender = entity.cp.render;
    const selected = entity.id === this.settingsManager.cp.selectionManager.id;
    const scale = this.viewport.scale.x;

    entityRender.sprite.scale.set(
      (1 /
        (scale *
          (scale < (layerScaleThresholds[entityRender.layer] ?? 1) * 2
            ? 2
            : 1))) *
        entityRender.defaultScale *
        (selected ? 1.5 : 1)
    );
  };

  updateScaling = () => {
    this.sim.queries.renderable.get().forEach(this.updateEntityScaling);
    Object.entries(this.layers).forEach(([name, layer]) => {
      layer.visible =
        (layerScaleThresholds[name] ?? 0) <= this.viewport.scale.x;
    });
  };

  updateViewport = () => {
    this.keysPressed.forEach((key) => {
      const dPos = 10;
      const dScale = 40;
      const keymap = {
        w: { x: 0, y: -dPos },
        ArrowUp: { x: 0, y: -dPos },
        s: { x: 0, y: dPos },
        ArrowDown: { x: 0, y: dPos },
        a: { x: -dPos, y: 0 },
        ArrowLeft: { x: -dPos, y: 0 },
        d: { x: dPos, y: 0 },
        ArrowRight: { x: dPos, y: 0 },
        x: { scale: -dScale },
        "=": { scale: -dScale },
        z: { scale: dScale },
        "-": { scale: dScale },
      };

      if (keymap[key]?.x !== undefined) {
        this.viewport.moveCenter(
          this.viewport.center.x + keymap[key].x / this.viewport.scale.x,
          this.viewport.center.y + keymap[key].y / this.viewport.scale.x
        );

        this.settingsManager.cp.selectionManager.focused = false;
        this.viewport.plugins.remove("follow");
      }

      if (keymap[key]?.scale !== undefined) {
        this.viewport.zoom(keymap[key].scale / this.viewport.scale.x, true);
      }
    });

    this.settingsManager.cp.camera.zoom = this.viewport.scale.x;
    this.settingsManager.cp.camera.position = [
      this.viewport.center.x,
      this.viewport.center.y,
    ];
  };

  toggleGrid = () => {
    if (this.grid) {
      this.grid.unregister();
      this.grid = null;
    } else {
      const grid = new Entity(this.sim);
      this.sim.registerEntity(grid);
      grid.addComponent(createRenderGraphics("hexGrid"));
      this.grid = grid as RequireComponent<"renderGraphics">;
    }
  };

  exec = (delta: number): void => {
    super.exec(delta);
    if (!this.initialized) {
      this.init();
      return;
    }
    this.cooldowns.update(delta);
    this.settingsManager = this.sim.queries.settings.get()[0];

    this.hook(
      this.settingsManager.cp.selectionManager.id,
      this.updateSelection
    );
    this.hook(this.viewport.scale.x, this.updateScaling);

    if (this.settingsManager.cp.selectionManager.focused) {
      const entity = this.sim.getOrThrow(
        this.settingsManager.cp.selectionManager.id!
      );
      if (entity.hasComponents(["render"])) {
        this.viewport.follow(
          entity.requireComponents(["render"]).cp.render.sprite
        );
      } else {
        this.settingsManager.cp.selectionManager.focused = false;
      }
    }

    setTimeout(() => {
      this.updateViewport();
      this.updateGraphics();
      this.updateRenderables();
    }, 0);
  };
}
