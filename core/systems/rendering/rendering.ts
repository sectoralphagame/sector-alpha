import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
import Color from "color";
import { Entity } from "@core/entity";
import { manifest } from "@assets/icons";
import type { Sim } from "@core/sim";
import { isHeadless } from "@core/settings";
import { first } from "@fxts/core";
import { storageHook } from "@core/hooks";
import { hecsToCartesian } from "@core/components/hecsPosition";
import { sectorSize, type Sector } from "@core/archetypes/sector";
import { actionLoader } from "@core/actionLoader";
import {
  createRenderGraphics,
  graphics,
} from "../../components/renderGraphics";
import type { RequireComponent } from "../../tsHelpers";
import { SystemWithHooks } from "../utils/hooks";
import type { Layer, Textures } from "../../components/render";
import { SectorIndex } from "../utils/sectorIndex";
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

export class RenderingSystem extends SystemWithHooks<never> {
  rendering: true;
  settingsManager: RequireComponent<"camera">;
  viewport: Viewport;
  app: PIXI.Application;
  initialized = false;
  enableResizing = true;
  resizeObserver: ResizeObserver;
  dragging: boolean = false;
  keysPressed = new Set<string>();
  toolbar: HTMLDivElement | null;
  overlay: HTMLDivElement | null;
  grid: RequireComponent<"renderGraphics"> | null = null;
  layers: Record<Layer, PIXI.Container>;
  sectorIndex = new SectorIndex(["render"]);
  sprites: Map<Entity, PIXI.Sprite> = new Map();
  graphics: Map<Entity, PIXI.Graphics> = new Map();
  displayRange: boolean;
  scale: number;
  lastClicked: number;

  apply = (sim: Sim) => {
    super.apply(sim);
    this.sectorIndex.apply(sim);
    if (!isHeadless) {
      (window as any).rendering = this;
    }

    sim.hooks.phase.render.subscribe("RenderingSystem", this.exec);
  };

  init = () => {
    this.settingsManager = first(this.sim.index.settings.getIt())!;
    this.toolbar = document.querySelector("#toolbar");
    this.overlay = document.querySelector("#overlay");
    const root = document.querySelector("#root")!;
    const canvasRoot = document.querySelector(
      "#map-overlay"
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
      backgroundColor: Color("#000").rgbNumber(),
    });

    this.initViewport(root, canvasRoot);
    this.initLayers();
    this.initListeners();

    actionLoader.register(
      {
        type: "basic",
        slug: "toggleGrid",
        name: "Toggle hex grid",
        category: "drawing",
        description: "Toggle hexagonal grid",
        fn: () => this.toggleGrid(),
      },
      this.constructor.name
    );

    actionLoader.register(
      {
        type: "basic",
        slug: "displayRange",
        name: "Display range",
        category: "drawing",
        description: "Toggle displaying entity ranges",
        fn: () => {
          this.displayRange = !this.displayRange;
        },
      },
      this.constructor.name
    );

    this.initialized = true;
    this.scale = window.localStorage.getItem("gameSettings")
      ? JSON.parse(window.localStorage.getItem("gameSettings")!).scale / 10
      : 1;
    storageHook.subscribe("RenderingSystem", this.onSettingsChange);
  };

  initViewport = (root: Element, canvasRoot: HTMLCanvasElement) => {
    this.viewport = new Viewport({
      screenWidth: root.clientWidth,
      screenHeight: window.innerHeight,
      events: this.app.renderer.events,
    });

    this.app.stage.addChild(this.viewport);

    this.viewport.drag().wheel().decelerate({
      friction: 0.95,
    });
    this.viewport.clampZoom({ minScale, maxScale });
    this.viewport.on("drag-start", () => {
      if (this.toolbar) {
        this.toolbar.style.pointerEvents = "none";
      }
      this.viewport.plugins.remove("follow");
      this.dragging = true;
    });
    this.viewport.on("drag-end", () => {
      // Hack to prevent click events from firing after drag
      setTimeout(() => {
        this.dragging = false;
      }, 10);
    });

    this.viewport.sortableChildren = true;

    if (this.enableResizing) {
      this.resizeObserver = new ResizeObserver(() => {
        this.app.resizeTo = canvasRoot;
        this.viewport.resize(root.clientWidth, window.innerHeight);
      });
      this.resizeObserver.observe(canvasRoot);
    }

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
      if (
        event.target !== document.body ||
        Number(this.overlay?.children.length) > 0
      )
        return;

      this.keysPressed.add(event.key);
    });

    window.addEventListener("keyup", (event) => {
      this.keysPressed.delete(event.key);
    });

    this.sim.hooks.removeComponent.subscribe(
      "RenderingSystem",
      ({ entity, component }) =>
        this.clearEntity(
          entity,
          component === "render",
          component === "renderGraphics"
        )
    );

    this.sim.hooks.removeEntity.subscribe("RenderingSystem", (entity) => {
      this.clearEntity(entity);
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
    storageHook.unsubscribe(this.onSettingsChange);
    this.resizeObserver?.disconnect();
    this.viewport.destroy();
    this.app.destroy(true);
  };

  updateGraphics = () => {
    for (const entity of this.sim.index.renderableGraphics.getIt()) {
      let g = this.graphics.get(entity);
      if (
        entity.cp.renderGraphics.redraw ||
        entity.cp.renderGraphics.realTime ||
        !g
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
        entity.cp.renderGraphics.redraw = false;
      }
    }
  };

  updateRenderables = () => {
    for (const sectorId of this.sectorIndex.getSectors()) {
      const sector = this.sim.getOrThrow<Sector>(sectorId);
      const sectorPos = hecsToCartesian(
        sector.cp.hecsPosition.value,
        sectorSize / 10
      );

      for (const entity of this.sectorIndex.sectors[sectorId]!) {
        const entityRender = entity.cp.render;
        let sprite = this.sprites.get(entity);

        if (!sprite) {
          sprite = new PIXI.Sprite();
          setTexture(entity, sprite, entityRender.texture);
          sprite.cullable = true;
          this.sprites.set(entity, sprite);
          this.viewport.addChild(sprite);

          sprite.tint = entityRender.color;
          this.layers[entityRender.layer].addChild(sprite);
          this.updateEntityScaling(entity);
          entity.cp.position.moved = true;
        }

        drawHpBars(entity, sprite);

        if (entity.cp.position.moved) {
          entity.cp.position.moved = false;

          sprite!.position.set(
            (sectorPos[0] + entity.cp.position.coord[0]) * 10,
            (sectorPos[1] + entity.cp.position.coord[1]) * 10
          );
          sprite!.rotation = entity.cp.render.static
            ? -Math.PI / 2
            : entity.cp.position.angle;
        }

        if (getTexture(entityRender.texture) !== sprite?.texture) {
          setTexture(entity, sprite!, entityRender.texture);
        }
        if (entity.tags.has("selection") !== sprite?.interactive) {
          sprite!.interactive = entity.tags.has("selection");
        }
        if (!entityRender.hidden !== sprite?.visible) {
          sprite!.visible = !entityRender.hidden;
        }
      }
    }
  };

  updateEntityScaling = (entity: RequireComponent<"render">) => {
    const entityRender = entity.cp.render;
    const sprite = this.sprites.get(entity);
    const selected = false;
    const scale = this.viewport.scale.x;

    if (!sprite) return;

    sprite.scale.set(
      (1 /
        (scale *
          (scale < (layerScaleThresholds[entityRender.layer] ?? 1) * 2
            ? 2
            : 1))) *
        entityRender.defaultScale *
        (selected ? 1.5 : 1) *
        this.scale
    );
  };

  updateScaling = () => {
    for (const entity of this.sectorIndex.all()) {
      this.updateEntityScaling(entity);
    }

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
    // For some reason this is needed to prevent logging error when loading game
    if (!this.viewport.transform) return;

    this.settingsManager = first(this.sim.index.settings.getIt())!;

    this.onChange(this.viewport.scale.x, this.updateScaling);

    setTimeout(() => {
      this.updateGraphics();
      this.updateViewport();
      this.updateRenderables();
    }, 0);
  };

  onSettingsChange = (key: string) => {
    if (key === "gameSettings") {
      this.scale = JSON.parse(window.localStorage.getItem(key)!).scale / 10;
      this.updateScaling();
    }
  };
}
