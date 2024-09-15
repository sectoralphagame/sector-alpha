import React from "react";
import type { GLTF } from "ogl";
import { AxesHelper, GLTFLoader, Vec3 } from "ogl";
import sCiv from "@assets/models/ships/sCiv_1.glb";
import { useSim } from "@ui/atoms";
import { defaultIndexer } from "@core/systems/utils/default";
import { fromEntries, keys, map, pipe } from "@fxts/core";
import type { Ship } from "@core/archetypes/ship";
import { hecsToCartesian } from "@core/components/hecsPosition";
import type { Sector } from "@core/archetypes/sector";
import { addBasic } from "@ogl-engine/loaders/basic/basic";
import type { OGLCallback } from "@ogl-engine/OglCanvas";
import { OglCanvas } from "@ogl-engine/OglCanvas";
import { MapControl } from "@ogl-engine/MapControl";

const modelsToLoad = { sCiv };

export const TacticalMap: React.FC = React.memo(() => {
  const [sim] = useSim();
  const models = React.useRef<Record<string, GLTF>>({});
  const controlRef = React.useRef<MapControl>();

  const onInit: OGLCallback = React.useCallback(
    async ({ gl, camera, scene }) => {
      controlRef.current = new MapControl(camera);
      camera.far = 1000;
      const helper = new AxesHelper(gl);
      helper.setParent(scene);

      await Promise.all(
        Object.entries(modelsToLoad).map(([modelName, modelPath]) =>
          GLTFLoader.load(gl, modelPath).then((model) => {
            models.current[modelName] = model;
            addBasic(gl, model, scene, true);

            model.meshes[0].primitives[0].geometry.addAttribute("offset", {
              instanced: true,
              count: 0,
              data: new Float32Array(3000),
              size: 3,
              usage: gl.DYNAMIC_DRAW,
            });
            model.meshes[0].primitives[0].geometry.addAttribute("angle", {
              instanced: true,
              count: 0,
              data: new Float32Array(1000),
              size: 1,
              usage: gl.DYNAMIC_DRAW,
            });
            model.meshes[0].primitives[0].scale = new Vec3(1 / 50);
          })
        )
      );
    },
    []
  );

  const onUpdate: OGLCallback = () => {
    const objectsToRender: Record<string, number[]> = pipe(
      models.current,
      keys,
      map((model) => [model, []] as [string, number[]]),
      fromEntries
    );

    const ships = defaultIndexer.ships.get();
    for (const ship of ships) {
      if (!(ship.cp.render.texture in modelsToLoad)) {
        ship.cp.render.texture = "sCiv";
      }
      objectsToRender[ship.cp.render.texture].push(ship.id);
    }

    for (const [name, model] of Object.entries(models.current)) {
      const offset =
        model.meshes[0].primitives[0].geometry.attributes.offset.data!;
      const angle =
        model.meshes[0].primitives[0].geometry.attributes.angle.data!;
      for (let i = 0; i < objectsToRender[name].length; i++) {
        const ship = sim.getOrThrow<Ship>(objectsToRender[name][i]);
        const sectorPos = hecsToCartesian(
          sim.getOrThrow<Sector>(ship.cp.position.sector).cp.hecsPosition.value,
          10
        );
        offset.set(
          [
            ship.cp.position.coord[0] + sectorPos[0],
            0,
            ship.cp.position.coord[1] + sectorPos[1],
          ],
          i * 3
        );
        angle[i] = ship.cp.position.angle;
      }

      model.meshes[0].primitives[0].geometry.attributes.offset.count =
        objectsToRender[name].length;
      model.meshes[0].primitives[0].geometry.attributes.offset.data = offset;
      model.meshes[0].primitives[0].geometry.attributes.offset.needsUpdate =
        true;

      model.meshes[0].primitives[0].geometry.attributes.angle.count =
        objectsToRender[name].length;
      model.meshes[0].primitives[0].geometry.attributes.angle.data = angle;
      model.meshes[0].primitives[0].geometry.attributes.angle.needsUpdate =
        true;
    }

    controlRef.current!.update();
  };

  return <OglCanvas onInit={onInit} onUpdate={onUpdate} />;
});
