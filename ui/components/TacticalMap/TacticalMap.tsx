import React from "react";
import { Raycast, Vec2, Vec3 } from "ogl";
import { defaultIndexer } from "@core/systems/utils/default";
import { find, first } from "@fxts/core";
import { OglCanvas } from "@ogl-engine/OglCanvas";
import { MapControl } from "@ogl-engine/MapControl";
import type { RequireComponent } from "@core/tsHelpers";
import { defaultClickSound } from "@kit/BaseButton";
import { assetLoader } from "@ogl-engine/AssetLoader";
import { Skybox } from "@ogl-engine/materials/skybox/skybox";
import { Engine } from "@ogl-engine/engine/engine";
import { selectingSystem } from "@core/systems/selecting";
import { Path } from "@ogl-engine/utils/path";
import { sectorObservable } from "@ui/state/sector";
import type { SkyboxTexture } from "@assets/textures/skybox";
import { ParticleGenerator } from "@ogl-engine/ParticleGenerator";
import { Scene } from "@ogl-engine/engine/Scene";
import type { Sim } from "@core/sim";
import { contextMenuObservable } from "@ui/state/contextMenu";
import { storageHook } from "@core/hooks";
import type { GameSettings } from "@ui/hooks/useGameSettings";
import type { MouseButton } from "@ogl-engine/Orbit";
import mapData from "../../../core/world/data/map.json";
import { EntityMesh } from "./EntityMesh";

// FIXME: This is just an ugly hotfix to keep distance between things larger
const scale = 2;

export class TacticalMap extends React.PureComponent<{ sim: Sim }> {
  engine: Engine;
  sim: Sim;
  raycast = new Raycast();
  raycastHits: EntityMesh[] = [];
  settingsManager: RequireComponent<"selectionManager" | "camera">;
  lastClicked = 0;
  control: MapControl;
  meshes: Map<number, EntityMesh> = new Map();

  constructor(props) {
    super(props);
    this.sim = props.sim;
    this.engine = new Engine();
    this.settingsManager = first(this.sim.index.settings.getIt())!;
  }

  componentDidMount(): void {
    sectorObservable.notify(
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
    sectorObservable.subscribe("TacticalMap", () => this.onSectorChange());
    selectingSystem.hook.subscribe("TacticalMap", (...args) =>
      this.onSelectedChange(...args)
    );
    storageHook.subscribe("TacticalMap", (key) => {
      if (key !== "gameSettings") return;
      this.updateEngineSettings();
    });
  }

  onSectorChange() {
    this.engine.scene.traverse((mesh) => {
      if (mesh instanceof ParticleGenerator || mesh instanceof Skybox) {
        mesh.destroy();
      }
    });

    this.engine.setScene(new Scene(this.engine));
  }

  async onControlClick(mousePosition: Vec2, button: MouseButton) {
    if (this.raycastHits.length) {
      // eslint-disable-next-line default-case
      switch (button) {
        case 0:
          this.settingsManager.cp.selectionManager.id =
            this.raycastHits[0].entityId;
          defaultClickSound.play();

          if (Date.now() - this.lastClicked < 200) {
            this.settingsManager.cp.selectionManager.focused = true;
          }

          this.lastClicked = Date.now();
          break;
        case 2:
          this.settingsManager.cp.selectionManager.secondaryId =
            this.raycastHits[0].entityId;
      }
    }

    if (button === 2) {
      const worldPos = this.raycast.intersectPlane({
        origin: new Vec3(0),
        normal: new Vec3(0, 1, 0),
      });
      const worldPosition = [worldPos.x / scale, worldPos.z / scale];

      const data = {
        active: true,
        position: mousePosition.clone(),
        worldPosition,
        sector: sectorObservable.value,
      };
      contextMenuObservable.notify(data);
    }
  }

  async onEngineInit() {
    await assetLoader.load(this.engine.gl);

    this.control = new MapControl(this.engine.camera, this.engine.canvas);
    this.control.onClick = this.onControlClick.bind(this);
    this.control.onPan = () => {
      this.settingsManager.cp.selectionManager.focused = false;
    };

    this.sim.hooks.removeEntity.subscribe("TacticalMap", (entity) => {
      if (this.meshes.has(entity.id)) {
        const m = this.meshes.get(entity.id)!;
        this.engine.scene.removeChild(m);
      }
    });

    this.updateEngineSettings();
  }

  async onEngineUpdate() {
    if (!assetLoader.ready) return;
    const selectedEntity = this.sim.get(
      this.settingsManager.cp.selectionManager.id!
    );

    this.loadSkybox();

    for (const entity of defaultIndexer.renderable.getIt()) {
      if (entity.cp.position.sector !== sectorObservable.value.id) {
        if (this.meshes.has(entity.id)) {
          this.engine.scene.removeChild(this.meshes.get(entity.id)!);
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
            entity.cp.render.model = "ship/mCiv";
          }

          if (entity.cp.dockable.size === "large") {
            entity.cp.render.model = "ship/lMil";
          }

          if (entity.cp.model?.slug === "dart") {
            entity.cp.render.model = "ship/dart";
          }
        } else if (entity.hasTags(["facility"])) {
          if (entity.tags.has("gateway")) {
            entity.cp.render.model = "facility/gateway";
          } else {
            entity.cp.render.model = "facility/default";
          }
        }
      }

      if (!this.meshes.has(entity.id)) {
        const mesh = new EntityMesh(this.engine, entity);
        this.engine.scene.addChild(mesh);
        this.meshes.set(entity.id, mesh);
      }

      const mesh = this.meshes.get(entity.id)!;
      mesh.updatePosition();
    }

    const normalisedMousePos = new Vec2(
      2.0 * (this.control!.mouse.x / this.engine.gl.renderer.width) - 1.0,
      2.0 * (1.0 - this.control!.mouse.y / this.engine.gl.renderer.height) - 1.0
    );
    this.raycast.castMouse(this.engine.camera, normalisedMousePos);
    this.raycastHits = this.raycast.intersectBounds([
      ...this.meshes.values(),
    ]) as EntityMesh[];

    this.engine.canvas.style.cursor = this.raycastHits.length
      ? "pointer"
      : "default";

    const path = this.engine.scene.children.find((c) => c instanceof Path) as
      | Path
      | undefined;
    if (path && selectedEntity) {
      path.update(
        Path.getPath(
          selectedEntity.requireComponents(["position", "orders"]),
          scale
        )
      );
    }

    if (this.settingsManager.cp.selectionManager.focused && selectedEntity) {
      const entity = selectedEntity.requireComponents(["position"]);
      this.control!.lookAt(
        new Vec3(
          entity.cp.position.coord[0] * scale,
          0,
          entity.cp.position.coord[1] * scale
        )
      );

      if (sectorObservable.value.id !== entity.cp.position.sector) {
        sectorObservable.notify(this.sim.getOrThrow(entity.cp.position.sector));
      }
    }
    this.control!.update();
  }

  onSelectedChange([prevId, id]: (number | null)[]) {
    if (prevId) {
      this.meshes.get(prevId)?.setSelected(false);
      const path = this.engine.scene.children.find((c) => c instanceof Path);
      if (path) {
        this.engine.scene.removeChild(path);
      }
    }
    if (id) {
      this.meshes.get(id)?.setSelected(true);
      const entity = this.sim.getOrThrow(id);
      if (entity.hasComponents(["position", "orders"])) {
        const path = new Path(this.engine);
        this.engine.scene.addChild(path);
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

  loadSkybox() {
    let skybox = this.engine.scene.children.find((c) => c instanceof Skybox);
    if (!skybox) {
      skybox = new Skybox(
        this.engine,
        (mapData.sectors.find(
          (s) => s.id === sectorObservable.value.cp.name.slug
        )?.skybox as SkyboxTexture) ?? "example"
      );
      skybox.setParent(this.engine.scene);
    }
  }

  render() {
    return <OglCanvas engine={this.engine} />;
  }
}
