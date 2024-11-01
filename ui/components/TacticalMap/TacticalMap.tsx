import React from "react";
import { AxesHelper, Raycast, Vec2 } from "ogl";
import { useSim } from "@ui/atoms";
import { defaultIndexer } from "@core/systems/utils/default";
import { first } from "@fxts/core";
import { hecsToCartesian } from "@core/components/hecsPosition";
import type { Sector } from "@core/archetypes/sector";
import { OglCanvas } from "@ogl-engine/OglCanvas";
import { MapControl } from "@ogl-engine/MapControl";
import type { RequireComponent } from "@core/tsHelpers";
import { defaultClickSound } from "@kit/BaseButton";
import { assetLoader } from "@ogl-engine/AssetLoader";
import { Skybox } from "@ogl-engine/loaders/skybox/skybox";
import type { OGLCallback } from "@ogl-engine/useOgl";
import type { EntityMesh } from "./EntityMesh";
import { createEntityMesh } from "./EntityMesh";

export const TacticalMap: React.FC = React.memo(() => {
  const [sim] = useSim();
  const controlRef = React.useRef<MapControl>();
  const raycastRef = React.useRef(new Raycast());
  const skybox = React.useRef<Skybox>();
  const meshes = React.useRef<Map<number, EntityMesh>>(new Map());
  const settingsManagerRef = React.useRef<
    RequireComponent<"selectionManager" | "camera">
  >(first(sim.index.settings.getIt())!);

  const onInit: OGLCallback = React.useCallback(
    async ({ gl, camera, scene }) => {
      await assetLoader.load(gl);

      skybox.current = new Skybox(gl, scene, "example");

      controlRef.current = new MapControl(camera);
      controlRef.current.onClick = async (pos, button) => {
        const normalisedMousePos = new Vec2(
          2.0 * (pos.x / gl.renderer.width) - 1.0,
          2.0 * (1.0 - pos.y / gl.renderer.height) - 1.0
        );
        raycastRef.current.castMouse(camera, normalisedMousePos);
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

              // if (Date.now() - this.lastClicked < 200) {
              //   settingsManagerRef.current.cp.selectionManager.focused = true;
              // }

              // this.lastClicked = Date.now();
              break;
            case 2:
              settingsManagerRef.current.cp.selectionManager.secondaryId =
                hits[0].entityId;
          }
        }
      };
      const helper = new AxesHelper(gl, {
        size: 50,
      });
      helper.setParent(scene);

      sim.hooks.removeEntity.subscribe("TacticalMap", (entity) => {
        if (meshes.current.has(entity.id)) {
          scene.removeChild(meshes.current.get(entity.id)!);
        }
      });
    },
    []
  );

  const onUpdate: OGLCallback = ({ gl, scene }) => {
    if (!assetLoader.ready) return;

    const ships = defaultIndexer.ships.get();
    for (const ship of ships) {
      // FIXME: Remove this debug code
      if (!(ship.cp.render.model in assetLoader.models)) {
        ship.cp.render.model = "ship/sCiv";

        if (ship.cp.dockable.size === "medium") {
          ship.cp.render.model = "ship/mCiv";
        }
      }

      if (!meshes.current.has(ship.id)) {
        const m = createEntityMesh(ship, gl);
        scene.addChild(m);
        meshes.current.set(ship.id, m);
      }

      const sectorPos = hecsToCartesian(
        sim.getOrThrow<Sector>(ship.cp.position.sector).cp.hecsPosition.value,
        10
      );

      const mesh = meshes.current.get(ship.id)!;

      mesh.position.set(
        ship.cp.position.coord[0] + sectorPos[0],
        0,
        ship.cp.position.coord[1] + sectorPos[1]
      );
      mesh.rotation.y = -ship.cp.position.angle;
    }

    controlRef.current!.update();
  };

  return <OglCanvas onInit={onInit} onUpdate={onUpdate} />;
});
