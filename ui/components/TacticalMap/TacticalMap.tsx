import React from "react";
import type { Transform } from "ogl";
import { Raycast, Vec2, Vec3 } from "ogl";
import { defaultIndexer } from "@core/systems/utils/default";
import { find } from "@fxts/core";
import { OglCanvas } from "@ogl-engine/OglCanvas";
import { MapControl } from "@ogl-engine/MapControl";
import { defaultClickSound } from "@kit/BaseButton";
import { assetLoader } from "@ogl-engine/AssetLoader";
import { Skybox } from "@ogl-engine/materials/skybox/skybox";
import { Path } from "@ogl-engine/utils/path";
import type { SkyboxTexture } from "@assets/textures/skybox";
import { TacticalMapScene } from "@ogl-engine/engine/Scene";
import type { Sim } from "@core/sim";
import { contextMenuStore } from "@ui/state/contextMenu";
import { storageHook } from "@core/hooks";
import type { GameSettings } from "@ui/hooks/useGameSettings";
import { MouseButton } from "@ogl-engine/Orbit";
import { Asteroids } from "@ogl-engine/engine/Asteroids";
import { fieldColors } from "@core/archetypes/asteroid";
import type { Destroyable } from "@ogl-engine/types";
import { Engine3D } from "@ogl-engine/engine/engine3d";
import { gameStore } from "@ui/state/game";
import { reaction } from "mobx";
import type { Position2D } from "@core/components/position";
import { Star } from "@ogl-engine/engine/Star";
import { Light } from "@ogl-engine/engine/Light";
import type { Entity } from "@core/entity";
import { SelectionBox } from "@ogl-engine/engine/SelectionBox";
import mapData from "../../../core/world/data/map.json";
import { EntityMesh } from "./EntityMesh";

// FIXME: This is just an ugly hotfix to keep distance between things larger
const scale = 2;

function isDestroyable(mesh: Transform): mesh is Transform & Destroyable {
  return !!(mesh as any).destroy;
}

export class TacticalMap extends React.PureComponent<{ sim: Sim }> {
  engine: Engine3D<TacticalMapScene>;
  sim: Sim;
  raycast = new Raycast();
  raycastHits: EntityMesh[] = [];
  lastClicked = 0;
  control: MapControl;
  meshes: Map<number, EntityMesh> = new Map();
  dragStart: Vec2 | null = null;
  selectionBox: SelectionBox;

  onUnmountCallbacks: (() => void)[] = [];

  constructor(props) {
    super(props);
    this.sim = props.sim;
    this.engine = new Engine3D<TacticalMapScene>();
    this.engine.setScene(new TacticalMapScene(this.engine));
  }

  componentDidMount(): void {
    gameStore.setSector(
      find(
        (s) => s.cp.name.value === "Teegarden's Star II",
        this.sim.index.sectors.get()
      )!
    );

    this.engine.hooks.onInit.subscribe("TacticalMap", () =>
      this.onEngineInit()
    );
    this.engine.hooks.onUpdate.subscribe("TacticalMap", () =>
      this.onEngineUpdate()
    );
    this.onUnmountCallbacks.push(
      reaction(
        () => gameStore.sector,
        () => {
          if (this.engine.initialized) {
            this.onSectorChange();
          }
        }
      )
    );
    this.onUnmountCallbacks.push(
      reaction(() => gameStore.selectedUnit, this.onSelectedChange.bind(this))
    );
    storageHook.subscribe("TacticalMap", (key) => {
      if (key !== "gameSettings") return;
      this.updateEngineSettings();
    });
    this.sim.hooks.removeEntity.subscribe("TacticalMap", (entity) => {
      if (this.meshes.has(entity.id)) {
        const mesh = this.meshes.get(entity.id)!;
        mesh.destroy();
        this.engine.scene.entities.removeChild(mesh);
        this.meshes.delete(entity.id);
        if (gameStore.selectedUnit?.id === entity.id) {
          gameStore.unselectUnit();
        }
      }
    });
  }

  componentWillUnmount(): void {
    this.onUnmountCallbacks.forEach((cb) => cb());
  }

  handleEntityClick() {
    if (this.raycastHits.length) {
      let mesh = this.raycastHits[0];
      if (
        gameStore.selectedUnit?.id === mesh.entityId &&
        this.raycastHits.length > 1
      ) {
        mesh = this.raycastHits[1];
      }
      const isDoubleClick = Date.now() - this.lastClicked < 200;
      gameStore.unfocus();
      gameStore.setSelectedUnit(this.sim.getOrThrow(mesh.entityId));
      defaultClickSound.play();

      if (isDoubleClick) {
        gameStore.focus();
      }

      this.lastClicked = Date.now();
    }
  }

  async onEngineUpdate() {
    if (!(assetLoader.ready && this.engine.isFocused())) return;

    if (this.dragStart) {
      const normalisedDragStart = new Vec2(
        2.0 * (this.dragStart.x / this.engine.gl.renderer.width) - 1.0,
        2.0 * (1.0 - this.dragStart.y / this.engine.gl.renderer.height) - 1.0
      );

      const normalisedMousePos = new Vec2(
        2.0 * (this.control!.mouse.x / this.engine.gl.renderer.width) - 1.0,
        2.0 * (1.0 - this.control!.mouse.y / this.engine.gl.renderer.height) -
          1.0
      );
      this.selectionBox.updateGeometry(normalisedDragStart, normalisedMousePos);
    }
    this.updateRenderables();
    this.updateRaycast();

    this.engine.canvas.style.cursor = this.raycastHits.length
      ? "pointer"
      : "default";

    this.updateUIElements();
    this.updateSelection();
    this.control!.update();
  }

  onRightClick() {
    const targetId = this.raycastHits.length
      ? this.raycastHits[0].entityId
      : null;
    const worldPos = this.raycast.intersectPlane({
      origin: new Vec3(0),
      normal: new Vec3(0, 1, 0),
    });
    const worldPosition: Position2D = [worldPos.x / scale, worldPos.z / scale];

    contextMenuStore.open({
      position: this.control.mouse.clone().toArray() as Position2D,
      worldPosition,
      sector: gameStore.sector,
      target: targetId ? this.sim.getOrThrow(targetId) : null,
    });
  }

  async onEngineInit() {
    await assetLoader.load(this.engine.gl);

    this.control = new MapControl(this.engine.camera, this.engine.canvas);
    this.control.onPointerUp = this.onPointerUp.bind(this);
    this.control.onPointerDown = this.onControlClick.bind(this);
    this.control.onRightClick = this.onRightClick.bind(this);
    this.control.onPan = () => {
      gameStore.unfocus();
    };
    this.control.isFocused = this.engine.isFocused.bind(this.engine);
    this.control.onKeyDown = this.onKeyDown.bind(this);

    this.selectionBox = new SelectionBox(this.engine);
    this.selectionBox.setParent(this.engine.scene.ui);

    this.updateEngineSettings();
    this.loadSector();
  }

  onPointerUp(position: Vec2, button: MouseButton) {
    if (
      button === MouseButton.Left &&
      this.dragStart &&
      this.dragStart!.distance(position) > 0.1
    ) {
      this.removeSelectionBox();
      console.log(this.selectionBox.getEntitiesInSelection());
    } else if (button === MouseButton.Left) {
      this.handleEntityClick();
    }
    this.dragStart = null;
  }

  async onControlClick(mousePosition: Vec2, button: MouseButton) {
    if (button === MouseButton.Left) {
      this.dragStart = mousePosition.clone();
      this.drawSelectionBox();
    }
  }

  onKeyDown(event: KeyboardEvent) {
    const selectedEntity = gameStore.selectedUnit?.requireComponents([
      "position",
    ]);

    if (event.code === "KeyR" && selectedEntity) {
      if (selectedEntity.cp.position.sector !== gameStore.sector.id) {
        gameStore.setSector(
          this.sim.getOrThrow(selectedEntity.cp.position.sector)
        );
      }
      this.control.lookAt(
        new Vec3(
          selectedEntity.cp.position.coord[0] * scale,
          0,
          selectedEntity.cp.position.coord[1] * scale
        )
      );
      gameStore.focus();
    }
  }

  onSectorChange() {
    this.engine.scene.traverse((mesh) => {
      if (isDestroyable(mesh)) {
        mesh.destroy();
      }
      if (mesh instanceof Light) {
        this.engine.removeLight(mesh);
      }
    });

    this.engine.setScene(new TacticalMapScene(this.engine));
    this.loadSector();
  }

  onSelectedChange(entity: Entity | null, prevEntity: Entity | null) {
    if (prevEntity) {
      this.meshes.get(prevEntity.id)?.setSelected(false);
      const path = this.engine.scene.ui.children.find((c) => c instanceof Path);
      if (path) {
        this.engine.scene.ui.removeChild(path);
      }
    }
    if (entity) {
      this.meshes.get(entity.id)?.setSelected(true);
      if (entity.hasComponents(["position", "orders"])) {
        const path = new Path(this.engine);
        this.engine.scene.ui.addChild(path);
      }
    }
  }

  drawSelectionBox() {
    this.selectionBox.setVisibility(true);
  }

  removeSelectionBox() {
    this.selectionBox.setVisibility(false);
  }

  updateRaycast() {
    const normalisedMousePos = new Vec2(
      2.0 * (this.control!.mouse.x / this.engine.gl.renderer.width) - 1.0,
      2.0 * (1.0 - this.control!.mouse.y / this.engine.gl.renderer.height) - 1.0
    );
    this.raycast.castMouse(this.engine.camera, normalisedMousePos);
    this.raycastHits = this.raycast.intersectBounds([
      ...this.meshes.values(),
    ]) as EntityMesh[];
  }

  updateRenderables() {
    for (const entity of defaultIndexer.renderable.getIt()) {
      if (entity.cp.position.sector !== gameStore.sector.id) {
        if (this.meshes.has(entity.id)) {
          this.meshes.get(entity.id)!.destroy();
          this.engine.scene.entities.removeChild(this.meshes.get(entity.id)!);
          this.meshes.delete(entity.id);
        }
        continue;
      }
      // FIXME: Remove this debug code
      if (!(entity.cp.render.model in assetLoader.models)) {
        // eslint-disable-next-line no-console
        console.log("Missing model:", entity.cp.render.model);
        if (entity.hasComponents(["dockable"])) {
          entity.cp.render.model = "ship/dart";

          if (entity.cp.dockable.size === "medium") {
            entity.cp.render.model = entity.tags.has("role:mining")
              ? "ship/mMinExample"
              : entity.tags.has("role:military")
              ? "ship/axe"
              : "ship/mCiv";
          }

          if (entity.cp.dockable.size === "large") {
            entity.cp.render.model = "ship/lMil";
          }

          if (entity.cp.model?.slug === "dart") {
            entity.cp.render.model = "ship/dart";
          }
        } else if (entity.hasTags(["facility"])) {
          entity.cp.render.model = "facility/default";
          if (entity.tags.has("gateway")) {
            entity.cp.render.model = "facility/gateway";
          }
        } else {
          // FIXME: This is just a placeholder for now
          entity.cp.render.model = "world/asteroid1";
        }
      }

      if (!this.meshes.has(entity.id)) {
        const mesh = new EntityMesh(this.engine, entity);
        this.engine.scene.entities.addChild(mesh);
        this.meshes.set(entity.id, mesh);
      }

      const mesh = this.meshes.get(entity.id)!;
      mesh.updatePosition();
    }
  }

  updateUIElements() {
    const path = this.engine.scene.ui.children.find(
      (c) => c instanceof Path
    ) as Path | undefined;
    if (
      path &&
      gameStore.selectedUnit &&
      gameStore.selectedUnit.hasComponents(["position", "orders"])
    ) {
      path.update(
        Path.getPath(
          gameStore.selectedUnit.requireComponents(["position", "orders"]),
          scale
        )
      );
    }
  }

  updateSelection() {
    if (gameStore.focused && gameStore.selectedUnit) {
      const entity = gameStore.selectedUnit.requireComponents(["position"]);
      this.control!.lookAt(
        new Vec3(
          entity.cp.position.coord[0] * scale,
          0,
          entity.cp.position.coord[1] * scale
        )
      );

      if (gameStore.sector.id !== entity.cp.position.sector) {
        gameStore.setSector(this.sim.getOrThrow(entity.cp.position.sector));
      }
    }
  }

  updateEngineSettings() {
    const settings: GameSettings = JSON.parse(
      localStorage.getItem("gameSettings")!
    );

    this.engine.fxaa = settings.graphics.fxaa;
    this.engine.postProcessing = settings.graphics.postProcessing;
  }

  loadSector() {
    this.loadSkybox();
    this.loadAsteroidFields();
    this.loadProps();
  }

  loadSkybox() {
    if (!this.engine.scene.skybox) {
      this.engine.scene.addSkybox(
        new Skybox(
          this.engine,
          (mapData.sectors.find((s) => s.id === gameStore.sector.cp.name.slug)
            ?.skybox as SkyboxTexture) ?? "example"
        )
      );
    }
  }

  loadAsteroidFields() {
    const fields = this.sim.index.asteroidFields.getIt();
    for (const field of fields) {
      if (field.cp.position.sector === gameStore.sector.id) {
        const fieldTransform = new Asteroids(
          this.engine,
          field.cp.asteroidSpawn.size,
          1,
          fieldColors[field.cp.asteroidSpawn.type]
        );
        fieldTransform.position.set(
          field.cp.position.coord[0] * scale,
          0,
          field.cp.position.coord[1] * scale
        );
        fieldTransform.scale.set(scale);
        this.engine.scene.addChild(fieldTransform);
      }
    }
  }

  loadProp(data: (typeof mapData)["sectors"][number]["props"][number]) {
    if (data.type === "star") {
      const star = new Star(this.engine, data.color);
      star.updatePositionFromSphericalCoords(
        data.position[0],
        data.position[1],
        data.position[2]
      );
      star.scale.set(data.scale);
      star.body.material.uniforms.uNoise.value = data.noise;
      star.body.material.uniforms.uNoisePower.value = data.noisePower;

      return star;
    }

    throw new Error("Unknown prop type");
  }

  loadProps() {
    const data = mapData.sectors.find(
      (s) => s.id === gameStore.sector.cp.name.slug
    );
    if (!data?.props) return;

    for (const prop of data.props) {
      const propObject = this.loadProp(prop);

      if (prop.name) propObject.name = prop.name;
      if ((propObject as any).createPaneFolder)
        (propObject as any).createPaneFolder();
      this.engine.scene.props.addChild(propObject);
    }
  }

  render() {
    return <OglCanvas engine={this.engine} />;
  }
}
