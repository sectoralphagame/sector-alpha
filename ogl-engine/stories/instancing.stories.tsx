import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import type { Position2D } from "@core/components/position";
import { OglCanvas } from "ogl-engine/OglCanvas";
import sCiv from "@assets/models/ship/sCiv.glb";
import type { GLTF } from "ogl";
import { GLTFLoader, Orbit, Vec3 } from "ogl";
import { addBasic } from "@ogl-engine/materials/basic/basic";
import { Engine } from "@ogl-engine/engine/engine";

interface InstancingStoryProps {
  cubes: number;
}

const InstancingStory: React.FC<InstancingStoryProps> = ({ cubes }) => {
  const engine = React.useMemo(() => new Engine(), []);
  const cubesRef = React.useRef<Position2D[]>([]);
  const timerRef = React.useRef(0);
  const modelRef = React.useRef<GLTF>();
  const controlRef = React.useRef<Orbit>();

  React.useEffect(() => {
    engine.hooks.onInit.subscribe("InstancingStory", async () => {
      controlRef.current = new Orbit(engine.camera);
      engine.camera.position.set(0, 10, 0);
      engine.camera.far = 1000000;

      const model = await GLTFLoader.load(engine.gl, sCiv);
      modelRef.current = model;
      // FIXME: addInstanced()
      addBasic(engine, model);
      model.meshes[0].primitives[0].geometry.addAttribute("offset", {
        instanced: true,
        count: 0,
        data: new Float32Array(cubes * 3),
        size: 3,
        usage: engine.gl.DYNAMIC_DRAW,
      });
      model.meshes[0].primitives[0].geometry.addAttribute("angle", {
        instanced: true,
        count: 0,
        data: new Float32Array(cubes),
        size: 1,
        usage: engine.gl.DYNAMIC_DRAW,
      });
      model.meshes[0].primitives[0].scale = new Vec3(0.01);
    });

    engine.hooks.onUpdate.subscribe("InstancingStory", () => {
      controlRef.current!.update();

      const nCubes = cubesRef.current.length;
      cubesRef.current = new Array(nCubes);
      timerRef.current += 0.01;

      for (let i = 0; i < nCubes; i++) {
        const angle = ((Math.PI * 2) / 4) * Math.sqrt(i * 3) + timerRef.current;
        cubesRef.current[i] = [
          Math.cos(angle) * Math.sqrt(i * 3),
          Math.sin(angle) * Math.sqrt(i * 3),
        ];
        modelRef.current!.meshes[0].primitives[0].geometry.attributes.offset.data!.set(
          [cubesRef.current[i][0], 0, cubesRef.current[i][1]],
          i * 3
        );
        modelRef.current!.meshes[0].primitives[0].geometry.attributes.angle.data![
          i
        ] = angle;
      }

      modelRef.current!.meshes[0].primitives[0].geometry.attributes.offset.count =
        nCubes;
      modelRef.current!.meshes[0].primitives[0].geometry.attributes.offset.needsUpdate =
        true;

      modelRef.current!.meshes[0].primitives[0].geometry.attributes.angle.count =
        nCubes;
      modelRef.current!.meshes[0].primitives[0].geometry.attributes.angle.needsUpdate =
        true;
    });
  }, []);

  React.useEffect(() => {
    cubesRef.current = new Array(cubes);

    if (modelRef.current)
      modelRef.current!.meshes[0].primitives[0].geometry.attributes.offset.data =
        new Float32Array(cubes * 3);
  }, [cubes]);

  return <OglCanvas engine={engine} />;
};

export default {
  title: "OGL / Instancing",
  parameters: {
    layout: "fullscreen",
  },
} as Meta;

const Template: StoryFn<InstancingStoryProps> = ({ cubes }) => (
  <div id="root">
    <Styles>
      <InstancingStory cubes={cubes} />
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {
  cubes: 5,
} as InstancingStoryProps;
