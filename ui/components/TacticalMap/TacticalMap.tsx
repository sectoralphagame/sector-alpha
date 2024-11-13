import React from "react";
import { Raycast, Vec2, Vec3 } from "ogl";
import { useContextMenu, useSim } from "@ui/atoms";
import { defaultIndexer } from "@core/systems/utils/default";
import { first } from "@fxts/core";
import { type Sector } from "@core/archetypes/sector";
import { OglCanvas } from "@ogl-engine/OglCanvas";
import { MapControl } from "@ogl-engine/MapControl";
import type { RequireComponent } from "@core/tsHelpers";
import { defaultClickSound } from "@kit/BaseButton";
import { assetLoader } from "@ogl-engine/AssetLoader";
import { Skybox } from "@ogl-engine/materials/skybox/skybox";
import { Engine } from "@ogl-engine/engine/engine";
import { selectingSystem } from "@core/systems/selecting";
import { Path } from "@ogl-engine/utils/path";
import { EntityMesh } from "./EntityMesh";

const scale = 2;

export const TacticalMap: React.FC = React.memo(() => {
  const [sim] = useSim();
  const engine = React.useMemo(() => new Engine(), []);
  const controlRef = React.useRef<MapControl>();
  const raycastRef = React.useRef(new Raycast());
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
  const activeSectorRef = React.useRef(defaultIndexer.sectors.get()[9]!.id);
  const lastClickedRef = React.useRef(0);
  const [, setMenu] = useContextMenu();

  React.useEffect(() => {
    engine.hooks.onInit.subscribe("TacticalMap", async () => {
      await assetLoader.load(engine.gl);

      skybox.current = new Skybox(engine.gl, engine.scene, "example");

      controlRef.current = new MapControl(engine.camera);
      controlRef.current.onClick = async (pos, button) => {
        const normalisedMousePos = new Vec2(
          2.0 * (pos.x / engine.gl.renderer.width) - 1.0,
          2.0 * (1.0 - pos.y / engine.gl.renderer.height) - 1.0
        );
        raycastRef.current.castMouse(engine.camera, normalisedMousePos);
        const hits = raycastRef.current.intersectBounds([
          ...meshes.current.values(),
        ]) as EntityMesh[];

        if (hits.length) {
          // eslint-disable-next-line default-case
          switch (button) {
            case 0:
              settingsManagerRef.current.cp.selectionManager.id =
                hits[0].entityId;
              defaultClickSound.play();

              if (Date.now() - lastClickedRef.current < 200) {
                settingsManagerRef.current.cp.selectionManager.focused = true;
              }

              lastClickedRef.current = Date.now();
              break;
            case 2:
              settingsManagerRef.current.cp.selectionManager.secondaryId =
                hits[0].entityId;
          }
        }
      };
      controlRef.current.onMove = () => {
        settingsManagerRef.current.cp.selectionManager.focused = false;
      };

      sim.hooks.removeEntity.subscribe("TacticalMap", (entity) => {
        if (meshes.current.has(entity.id)) {
          engine.scene.removeChild(meshes.current.get(entity.id)!);
        }
      });
    });

    engine.hooks.onUpdate.subscribe("TacticalMap", () => {
      if (!assetLoader.ready) return;
      const selectedEntity = sim.get(
        settingsManagerRef.current.cp.selectionManager.id!
      );

      for (const entity of defaultIndexer.renderable.getIt()) {
        if (entity.cp.position.sector !== activeSectorRef.current) continue;
        // FIXME: Remove this debug code
        if (!(entity.cp.render.model in assetLoader.models)) {
          if (entity.hasComponents(["dockable"])) {
            entity.cp.render.model = "ship/sCiv";

            if (entity.cp.dockable.size === "medium") {
              entity.cp.render.model = "ship/mCiv";
            }

            if (entity.cp.dockable.size === "large") {
              entity.cp.render.model = "ship/lMil";
            }
          } else if (entity.hasTags(["facility"])) {
            entity.cp.render.model = "facility/default";
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
      }
      controlRef.current!.update();
    });

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
        }
      }
    };
    selectingSystem.hook.subscribe("TacticalMap", onSelectedChange);

    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();

      setTimeout(() => {
        if (controlRef.current?.dragPrev) return;

        const worldPos = raycastRef.current.intersectPlane({
          origin: new Vec3(0),
          normal: new Vec3(0, 1, 0),
        });
        const worldPosition = [worldPos.x / scale, worldPos.z / scale];

        const data = {
          active: true,
          position: [event.clientX, event.clientY],
          worldPosition,
          sector: sim.getOrThrow<Sector>(activeSectorRef.current),
        };
        setMenu(data);
      }, 40);
    };

    window.addEventListener("contextmenu", onContextMenu);
  }, []);

  return <OglCanvas engine={engine} />;
});
