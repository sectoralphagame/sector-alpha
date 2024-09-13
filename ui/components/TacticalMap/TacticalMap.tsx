import React from "react";
import type { GLTF } from "ogl";
import { Renderer, Camera, Transform, GLTFLoader, Orbit } from "ogl";
import sCiv from "@assets/models/ships/sCiv_1.glb";
import { useSim } from "@ui/atoms";
import { addBasic } from "@devtools/components/OGLModel/loaders/basic";
import { defaultIndexer } from "@core/systems/utils/default";
import { fromEntries, keys, map, pipe } from "@fxts/core";
import type { Ship } from "@core/archetypes/ship";
import { hecsToCartesian } from "@core/components/hecsPosition";
import type { Sector } from "@core/archetypes/sector";

const modelsToLoad = { sCiv };

export const TacticalMap: React.FC = () => {
  const [sim] = useSim();
  const [canvas, setCanvas] = React.useState<HTMLCanvasElement | null>(null);
  const models = React.useRef<Record<string, GLTF>>({});

  React.useEffect(() => {
    if (!canvas) return;

    const renderer = new Renderer({
      canvas: canvas!,
      dpr: 2,
    });
    const gl = renderer.gl;

    const camera = new Camera(gl);
    camera.position.x = 5;
    camera.position.y = 5;
    camera.position.z = 5;
    camera.lookAt([0, 0, 0]);

    const control = new Orbit(camera);

    function resize() {
      renderer.setSize(
        canvas!.parentElement!.clientWidth - 5,
        canvas!.parentElement!.clientHeight - 5
      );
      camera.perspective({
        aspect: gl.canvas.width / gl.canvas.height,
      });
    }
    canvas!.addEventListener("resize", resize, false);
    resize();

    const obs = new ResizeObserver(resize);
    obs.observe(canvas!);

    setTimeout(resize, 1000);

    const scene = new Transform();

    Promise.all(
      Object.entries(modelsToLoad).map(([modelName, modelPath]) =>
        GLTFLoader.load(gl, modelPath).then((model) => {
          models.current[modelName] = model;
          addBasic(gl, model, scene);
          model.meshes[0].primitives[0].geometry.addAttribute("offset", {
            instanced: true,
            count: 0,
            data: new Float32Array(),
            size: 3,
            usage: gl.DYNAMIC_DRAW,
          });
        })
      )
    ).then(() => {
      function update(_t: number) {
        requestAnimationFrame(update);

        const objectsToRender: Record<string, number[]> = pipe(
          models.current,
          keys,
          map((model) => [model, []] as [string, number[]]),
          fromEntries
        );

        for (const ship of defaultIndexer.ships.getIt()) {
          if (ship.cp.render.texture in modelsToLoad) {
            objectsToRender[ship.cp.render.texture].push(ship.id);
          }
        }

        for (const [name, model] of Object.entries(models.current)) {
          const offset = new Float32Array(objectsToRender[name].length * 3);
          for (let i = 0; i < objectsToRender[name].length; i++) {
            const ship = sim.getOrThrow<Ship>(objectsToRender[name][i]);
            const sectorPos = hecsToCartesian(
              sim.getOrThrow<Sector>(ship.cp.position.sector).cp.hecsPosition
                .value,
              10
            );
            offset.set(
              [
                ship.cp.position.coord[0] + sectorPos[0],
                ship.cp.position.coord[1] + sectorPos[1],
                0,
              ],
              i * 3
            );
          }

          model.meshes[0].primitives[0].geometry.attributes.offset.count =
            objectsToRender[name].length;
          model.meshes[0].primitives[0].geometry.attributes.offset.data =
            offset;
          model.meshes[0].primitives[0].geometry.attributes.offset.needsUpdate =
            true;
        }

        control.update();

        renderer.render({ scene, camera });
      }
      requestAnimationFrame(update);
    });
  }, [canvas]);

  return <canvas ref={setCanvas} />;
};
