import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
import Color from "color";
import { Entity } from "@core/entity";
import { manifest } from "@assets/icons";
import type { Sim } from "@core/sim";
import { setCheat } from "@core/utils/misc";
import { isHeadless } from "@core/settings";
import {
  createRenderGraphics,
  graphics,
} from "../../components/renderGraphics";
import type { RequireComponent } from "../../tsHelpers";
import { Cooldowns } from "../../utils/cooldowns";
import { SystemWithHooks } from "../utils/hooks";
import { clearFocus } from "../../components/selection";
import type { Layer, Textures } from "../../components/render";
import { SectorQuery } from "../utils/sectorQuery";
import { drawHpBars } from "./hpBars";

const minScale = 0.08;
const maxScale = 40;

const layerScaleThresholds: Partial<Record<Layer, number>> = {
  collectible: 0.6,
  facility: 0.13,
  ship: 0.4,
};

let spritesheet: PIXI.Spritesheet;
if (!isHeadless) {
  spritesheet = new PIXI.Spritesheet(
    PIXI.BaseTexture.from(manifest.meta.image),
    manifest
  );
  spritesheet.parse();
}

export function getTexture(texture: keyof Textures) {
  return spritesheet.textures[texture];
}

export function setTexture(
  entity: RequireComponent<"render">,
  sprite: PIXI.Sprite,
  texture: keyof Textures
) {
  entity.cp.render.texture = texture;
  if (!isHeadless) {
    sprite.texture = getTexture(texture);
    sprite.anchor.set(0.5, 0.5);
  }
}

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
  sprites: Map<Entity, PIXI.Sprite> = new Map();
  graphics: Map<Entity, PIXI.Graphics> = new Map();

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

    this.initViewport(root, canvasRoot);
    this.initLayers();
    this.initListeners();

    setCheat("hexGrid", this.toggleGrid);

    this.initialized = true;
  };

  initViewport = (root: Element, canvasRoot: HTMLCanvasElement) => {
    this.viewport = new Viewport({
      screenWidth: root.clientWidth,
      screenHeight: window.innerHeight,
      events: this.app.renderer.events,
    });

    this.app.stage.addChild(this.viewport);

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

    this.viewport.sortableChildren = true;

    this.resizeObserver = new ResizeObserver(() => {
      this.app.resizeTo = canvasRoot;
      this.viewport.resize(root.clientWidth, window.innerHeight);
    });
    this.resizeObserver.observe(canvasRoot);

    this.viewport.scale.set(this.settingsManager.cp.camera.zoom);
    this.viewport.moveCenter(
      this.settingsManager.cp.camera.position[0],
      this.settingsManager.cp.camera.position[1]
    );
  };

  initLayers = () => {
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
  };

  initListeners = () => {
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

    this.sim.hooks.removeComponent.tap(
      "RenderingSystem",
      ({ entity, component }) =>
        this.clearEntity(
          entity,
          component === "render",
          component === "renderGraphics"
        )
    );

    this.sim.hooks.removeEntity.tap("RenderingSystem", (entity) => {
      this.clearEntity(entity);

      if (entity.id === this.settingsManager.cp.selectionManager.id) {
        this.settingsManager.cp.selectionManager.id = null;
      }
      if (entity.id === this.settingsManager.cp.selectionManager.secondaryId) {
        this.settingsManager.cp.selectionManager.secondaryId = null;
      }
    });
  };

  clearEntity = (entity: Entity, render = true, renderGraphics = true) => {
    if (render) {
      this.sprites.get(entity)?.destroy();
      this.sprites.delete(entity);
    }
    if (renderGraphics) {
      const g = this.graphics.get(entity);
      if (g && !g.destroyed) {
        g.destroy();
      }
      this.graphics.delete(entity);
    }
  };

  destroy = (): void => {
    this.resizeObserver.disconnect();
    this.viewport.destroy();
    this.app.destroy(true);
  };

  updateGraphics = () => {
    this.sim.queries.renderableGraphics.get().forEach((entity) => {
      let g = this.graphics.get(entity);
      if (entity.cp.renderGraphics.redraw || !g) {
        if (
          entity.cp.renderGraphics.realTime ||
          this.cooldowns.canUse("graphics")
        ) {
          if (!g) {
            g = new PIXI.Graphics();
            this.graphics.set(entity, g);
            this.viewport.addChild(g);
          } else {
            g.children.forEach((c) => c.destroy());
            g.clear();
          }
          graphics[entity.cp.renderGraphics.draw]({
            g,
            entity,
            viewport: this.viewport,
          });
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
      let sprite = this.sprites.get(entity);

      if (!sprite) {
        sprite = new PIXI.Sprite();
        setTexture(entity, sprite, entityRender.texture);
        this.sprites.set(entity, sprite);
        this.viewport.addChild(sprite);
        if (entity.tags.has("selection")) {
          sprite.interactive = true;
          sprite.addEventListener("pointerdown", (event) => {
            if (event.button === 0) {
              this.settingsManager.cp.selectionManager.id = entity.id;
            }
          });
          sprite.addEventListener("rightdown", () => {
            this.settingsManager.cp.selectionManager.secondaryId = entity.id;
          });
          sprite.cursor = "pointer";
          sprite.tint = entityRender.color;
          this.layers[entityRender.layer].addChild(sprite);
        }

        this.updateEntityScaling(entity);
        entity.cp.position.moved = true;
      }

      drawHpBars(entity, sprite);

      if (entity.cp.position.moved) {
        entity.cp.position.moved = false;

        sprite!.position.set(
          entity.cp.position.coord.get([0]) * 10,
          entity.cp.position.coord.get([1]) * 10
        );
        sprite!.rotation = entity.cp.position.angle;
      }

      if (getTexture(entityRender.texture) !== sprite?.texture) {
        setTexture(entity, sprite!, entityRender.texture);
      }
      if (entity.tags.has("selection") !== sprite?.interactive) {
        sprite!.interactive = entity.tags.has("selection");
      }
      if (entityRender.visible !== sprite?.visible) {
        sprite!.visible = entityRender.visible;
      }
    });
  };

  updateSelection = (previousValue: number) => {
    this.settingsManager.cp.selectionManager.focused = false;
    this.viewport.plugins.remove("follow");
    const previousSelected = this.sim.get(previousValue);
    if (previousSelected?.cp.renderGraphics?.draw === "path") {
      previousSelected.removeComponent("renderGraphics");
    }

    this.sim.queries.renderable.get().forEach((entity) => {
      const entityRender = entity.cp.render;
      const sprite = this.sprites.get(entity);
      const selected =
        entity.id === this.settingsManager.cp.selectionManager.id;

      if (!sprite) return;

      if (selected && sprite.tint === entityRender.color) {
        sprite.tint = Color(sprite.tint).lighten(0.23).rgbNumber();
        sprite.parent?.removeChild(sprite);
        this.layers.selection.addChild(sprite);

        if (entity.cp.orders) {
          entity.addComponent(createRenderGraphics("path"));
        }
      } else if (!selected && sprite.tint !== entityRender.color) {
        sprite.tint = entityRender.color;
        sprite.parent?.removeChild(sprite);
        this.layers[entityRender.layer].addChild(sprite);
      }
    });
    this.updateScaling();
  };

  updateEntityScaling = (entity: RequireComponent<"render">) => {
    const entityRender = entity.cp.render;
    const sprite = this.sprites.get(entity);
    const selected = entity.id === this.settingsManager.cp.selectionManager.id;
    const scale = this.viewport.scale.x;

    if (!sprite) return;

    sprite.scale.set(
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
        this.viewport.follow(this.sprites.get(entity)!);
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
