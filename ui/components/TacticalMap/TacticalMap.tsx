import React from "react";
import { Raycast, Vec2, Vec3 } from "ogl";
import { useContextMenu, useSim } from "@ui/atoms";
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
import { useGameSettings } from "@ui/hooks/useGameSettings";
import { sectorObservable } from "@ui/state/sector";
import type { SkyboxTexture } from "@assets/textures/skybox";
import { ParticleGenerator } from "@ogl-engine/ParticleGenerator";
import { Scene } from "@ogl-engine/engine/Scene";
import mapData from "../../../core/world/data/map.json";
import { EntityMesh } from "./EntityMesh";

const scale = 2;

export const TacticalMap: React.FC = React.memo(() => {
  const [sim] = useSim();
  const [gameSettings] = useGameSettings();
  const engine = React.useMemo(() => new Engine(), []);
  const controlRef = React.useRef<MapControl>();
  const raycastRef = React.useRef(new Raycast());
  const raycastHitsRef = React.useRef<EntityMesh[]>([]);
  const skybox = React.useRef<Skybox>();
  const meshes = React.useRef<Map<number, EntityMesh>>(new Map());
  const uiRef = React.useRef<
    Partial<{
      path: Path;
    }>
  >({});
  const settingsManagerRef = React.useRef<
    RequireComponent<"selectionManager" | "camera">
  >(first(sim.index.settings.getIt())!);
  const lastClickedRef = React.useRef(0);
  const [, setMenu] = useContextMenu();

  React.useEffect(() => {
    sectorObservable.notify(
      find(
        (s) => s.cp.name.value === "Teegarden's Star II",
        sim.index.sectors.get()
      )!
    );

    const changeSector = () => {
      engine.scene.traverse((mesh) => {
        // engine.scene.removeChild(mesh);
        if (mesh instanceof ParticleGenerator || mesh instanceof EntityMesh) {
          mesh.destroy();
        }
      });

      meshes.current.clear();
      if (skybox.current) {
        engine.scene.removeChild(skybox.current.transform);
        skybox.current = undefined;
      }

      engine.setScene(new Scene(engine));
    };

    engine.hooks.onInit.subscribe("TacticalMap", async () => {
      await assetLoader.load(engine.gl);

      controlRef.current = new MapControl(engine.camera, engine.canvas);
      controlRef.current.onClick = async (mousePosition, button) => {
        if (raycastHitsRef.current.length) {
          // eslint-disable-next-line default-case
          switch (button) {
            case 0:
              settingsManagerRef.current.cp.selectionManager.id =
                raycastHitsRef.current[0].entityId;
              defaultClickSound.play();

              if (Date.now() - lastClickedRef.current < 200) {
                settingsManagerRef.current.cp.selectionManager.focused = true;
              }

              lastClickedRef.current = Date.now();
              break;
            case 2:
              settingsManagerRef.current.cp.selectionManager.secondaryId =
                raycastHitsRef.current[0].entityId;
          }
        }

        if (button === 2) {
          const worldPos = raycastRef.current.intersectPlane({
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
          setMenu(data);
        }
      };
      controlRef.current.onPan = () => {
        settingsManagerRef.current.cp.selectionManager.focused = false;
      };

      sim.hooks.removeEntity.subscribe("TacticalMap", (entity) => {
        if (meshes.current.has(entity.id)) {
          const m = meshes.current.get(entity.id)!;
          engine.scene.removeChild(m);
        }
      });
    });

    engine.hooks.onUpdate.subscribe("TacticalMap", () => {
      if (!assetLoader.ready) return;
      const selectedEntity = sim.get(
        settingsManagerRef.current.cp.selectionManager.id!
      );

      if (!skybox.current) {
        skybox.current = new Skybox(
          engine,
          engine.scene,
          (mapData.sectors.find(
            (s) => s.id === sectorObservable.value.cp.name.slug
          )?.skybox as SkyboxTexture) ?? "example"
        );
      }

      for (const entity of defaultIndexer.renderable.getIt()) {
        if (entity.cp.position.sector !== sectorObservable.value.id) {
          if (meshes.current.has(entity.id)) {
            engine.scene.removeChild(meshes.current.get(entity.id)!);
            meshes.current.delete(entity.id);
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

        if (!meshes.current.has(entity.id)) {
          const m = new EntityMesh(engine, entity);
          engine.scene.addChild(m);
          meshes.current.set(entity.id, m);
        }

        const mesh = meshes.current.get(entity.id)!;

        mesh.position.set(
          entity.cp.position.coord[0] * scale,
          0,
          entity.cp.position.coord[1] * scale
        );
        mesh.rotation.y = -entity.cp.position.angle;

        mesh.visible = !entity.cp.render.hidden;
      }

      const normalisedMousePos = new Vec2(
        2.0 * (controlRef.current!.mouse.x / engine.gl.renderer.width) - 1.0,
        2.0 * (1.0 - controlRef.current!.mouse.y / engine.gl.renderer.height) -
          1.0
      );
      raycastRef.current.castMouse(engine.camera, normalisedMousePos);
      raycastHitsRef.current = raycastRef.current.intersectBounds([
        ...meshes.current.values(),
      ]) as EntityMesh[];

      engine.canvas.style.cursor = raycastHitsRef.current.length
        ? "pointer"
        : "default";

      if (uiRef.current.path && selectedEntity) {
        uiRef.current.path.update(
          Path.getPath(
            selectedEntity.requireComponents(["position", "orders"]),
            scale
          )
        );
      }

      if (
        settingsManagerRef.current.cp.selectionManager.focused &&
        selectedEntity
      ) {
        const entity = selectedEntity.requireComponents(["position"]);
        controlRef.current!.lookAt(
          new Vec3(
            entity.cp.position.coord[0] * scale,
            0,
            entity.cp.position.coord[1] * scale
          )
        );

        if (sectorObservable.value.id !== entity.cp.position.sector) {
          sectorObservable.notify(sim.getOrThrow(entity.cp.position.sector));
        }
      }
      controlRef.current!.update();
    });

    sectorObservable.subscribe("TacticalMap", changeSector);

    const onSelectedChange = ([prevId, id]: (number | null)[]) => {
      if (prevId) {
        meshes.current.get(prevId)?.setSelected(false);
        if (uiRef.current.path) {
          engine.scene.removeChild(uiRef.current.path);
        }
      }
      if (id) {
        meshes.current.get(id)?.setSelected(true);
        const entity = sim.getOrThrow(id);
        if (entity.hasComponents(["position", "orders"])) {
          const path = new Path(engine);
          engine.scene.addChild(path);
          uiRef.current.path = path;
        } else {
          uiRef.current.path = undefined;
        }
      }
    };
    selectingSystem.hook.subscribe("TacticalMap", onSelectedChange);
  }, []);

  React.useEffect(() => {
    engine.fxaa = gameSettings.graphics.fxaa;
  }, [gameSettings.graphics.fxaa]);
  React.useEffect(() => {
    engine.postProcessing = gameSettings.graphics.postProcessing;
  }, [gameSettings.graphics.postProcessing]);

  return <OglCanvas engine={engine} />;
});
