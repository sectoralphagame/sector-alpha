import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
import Color from "color";
import { Entity } from "@core/entity";
import { manifest } from "@assets/icons";
import type { Sim } from "@core/sim";
import { isHeadless } from "@core/settings";
import { first } from "@fxts/core";
import { storageHook } from "@core/hooks";
import type { ContextMenuApi } from "@ui/atoms";
import { worldToHecs } from "@core/components/hecsPosition";
import { deepEqual } from "mathjs";
import {
  createRenderGraphics,
  graphics,
} from "../../components/renderGraphics";
import type { RequireComponent } from "../../tsHelpers";
import type { Cooldowns } from "../../utils/cooldowns";
import { SystemWithHooks } from "../utils/hooks";
import { clearFocus } from "../../components/selection";
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

export class RenderingSystem extends SystemWithHooks<"graphics"> {
  rendering: true;
  settingsManager: RequireComponent<"selectionManager" | "camera">;
  viewport: Viewport;
  app: PIXI.Application;
  initialized = false;
  resizeObserver: ResizeObserver;
  cooldowns: Cooldowns<"graphics">;
  dragging: boolean = false;
  keysPressed = new Set<string>();
  toolbar: HTMLDivElement;
  overlay: HTMLDivElement;
  grid: RequireComponent<"renderGraphics"> | null = null;
  layers: Record<Layer, PIXI.Container>;
  sectorIndex: SectorIndex<"render">;
  sprites: Map<Entity, PIXI.Sprite> = new Map();
  graphics: Map<Entity, PIXI.Graphics> = new Map();
  displayRange: boolean;
  scale: number;
  contextMenuApi: ContextMenuApi;
  lastClicked: number;

  constructor(contextMenuApi: ContextMenuApi) {
    super();
    this.contextMenuApi = contextMenuApi;
  }

  apply = (sim: Sim) => {
    super.apply(sim);
    if (!isHeadless) {
      (window as any).rendering = this;
    }

    this.sectorIndex = new SectorIndex(sim, ["render"]);
    sim.hooks.phase.render.subscribe("RenderingSystem", this.exec);
  };

  init = () => {
    this.settingsManager = first(this.sim.queries.settings.getIt())!;
    this.toolbar = document.querySelector("#toolbar")!;
    this.overlay = document.querySelector("#overlay")!;
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

    this.sim.actions.register(
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

    this.sim.actions.register(
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
      ? JSON.parse(window.localStorage.getItem("gameSettings")!).scale
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
      this.settingsManager.cp.selectionManager.focused = false;
      this.viewport.plugins.remove("follow");
      this.dragging = true;
    });
    this.viewport.on("drag-end", () => {
      // Hack to prevent click events from firing after drag
      setTimeout(() => {
        this.dragging = false;
      }, 10);
    });

    this.viewport.on("pointerup", (event) => {
      if (this.toolbar) {
        this.toolbar.style.pointerEvents = "unset";
      }
      if (
        event.target === event.currentTarget &&
        !this.dragging &&
        // Do not clear on right click
        event.buttons !== 0
      ) {
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
      if (event.target !== document.body || this.overlay?.children.length > 0)
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

      if (entity.id === this.settingsManager.cp.selectionManager.id) {
        clearFocus(this.settingsManager.cp.selectionManager);
      }
      if (entity.id === this.settingsManager.cp.selectionManager.secondaryId) {
        this.settingsManager.cp.selectionManager.secondaryId = null;
      }
    });

    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();

      setTimeout(() => {
        if (this.dragging) return;

        const [, setMenu] = this.contextMenuApi;

        const { x: worldX, y: worldY } = this.viewport.toWorld(
          event.offsetX,
          event.offsetY
        );
        const worldPosition = [worldX / 10, worldY / 10];
        const sectors = this.sim.queries.sectors.get();
        const data = {
          active: true,
          position: [event.clientX, event.clientY],
          worldPosition,
          sector:
            sectors.find((s) => {
              const ww = worldToHecs([worldPosition[0], worldPosition[1]]);
              return deepEqual(s.cp.hecsPosition.value, ww);
            }) ?? null,
        };
        setMenu(data);
      }, 40);
    };

    window.addEventListener("contextmenu", onContextMenu);
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
    this.resizeObserver.disconnect();
    this.viewport.destroy();
    this.app.destroy(true);
  };

  updateGraphics = () => {
    for (const entity of this.sim.queries.renderableGraphics.getIt()) {
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
    }

    if (this.cooldowns.canUse("graphics")) {
      this.cooldowns.use("graphics", this.sim.speed);
    }
  };

  updateRenderables = () => {
    for (const sectorId of this.sectorIndex.sectors.keys()) {
      // const sector = this.sim.getOrThrow<Sector>(sectorId)

      for (const entity of this.sectorIndex.sectors.get(sectorId)!) {
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

                if (Date.now() - this.lastClicked < 200) {
                  this.settingsManager.cp.selectionManager.focused = true;
                }

                this.lastClicked = Date.now();
              }
            });
            sprite.addEventListener("rightdown", () => {
              this.settingsManager.cp.selectionManager.secondaryId = entity.id;
            });
            sprite.cursor = "pointer";
          }

          sprite.tint = entityRender.color;
          this.layers[entityRender.layer].addChild(sprite);
          this.updateEntityScaling(entity);
          entity.cp.position.moved = true;
        }

        drawHpBars(entity, sprite);

        if (entity.cp.position.moved) {
          entity.cp.position.moved = false;

          sprite!.position.set(
            entity.cp.position.coord[0] * 10,
            entity.cp.position.coord[1] * 10
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
      }
    }
  };

  updateSelection = (previousValue: number) => {
    this.settingsManager.cp.selectionManager.focused = false;
    this.viewport.plugins.remove("follow");
    const previousSelected = this.sim.get(previousValue);
    if (
      ["pathWithRange", "path"].includes(
        previousSelected?.cp.renderGraphics?.draw
      )
    ) {
      previousSelected!.removeComponent("renderGraphics");
    }

    for (const entity of this.sectorIndex.all()) {
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
          entity.addComponent(
            createRenderGraphics(this.displayRange ? "pathWithRange" : "path")
          );
        }
      } else if (!selected && sprite.tint !== entityRender.color) {
        sprite.tint = entityRender.color;
        sprite.parent?.removeChild(sprite);
        this.layers[entityRender.layer].addChild(sprite);
      }
    }
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
    // For some reason this is needed to prevent logging error when loading game
    if (!this.viewport.transform) return;

    this.settingsManager = first(this.sim.queries.settings.getIt())!;

    this.onChange(
      this.settingsManager.cp.selectionManager.id,
      this.updateSelection
    );
    this.onChange(this.viewport.scale.x, this.updateScaling);

    if (this.settingsManager.cp.selectionManager.focused) {
      const entity = this.sim.getOrThrow(
        this.settingsManager.cp.selectionManager.id!
      );
      if (entity.hasComponents(["render"])) {
        this.viewport.follow(this.sprites.get(entity)!);
      } else if (entity.hasComponents(["renderGraphics"])) {
        this.viewport.follow(this.graphics.get(entity)!);
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

  onSettingsChange = (key: string) => {
    if (key === "gameSettings") {
      this.scale = JSON.parse(window.localStorage.getItem(key)!).scale;
      this.updateScaling();
    }
  };
}
