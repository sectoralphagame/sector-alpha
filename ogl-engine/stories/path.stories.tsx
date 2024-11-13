import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { OglCanvas } from "ogl-engine/OglCanvas";
import sCiv from "@assets/models/ship/sCiv.glb";
import { Geometry, GLTFLoader, Mesh } from "ogl";
import { addBasic } from "@ogl-engine/materials/basic/basic";
import { MapControl } from "@ogl-engine/MapControl";
import { Engine } from "@ogl-engine/engine/engine";
import { Skybox } from "@ogl-engine/materials/skybox/skybox";
import { createPathMaterialProgram } from "@ogl-engine/materials/path/path";

const PathStory: React.FC = () => {
  const engine = React.useMemo(() => new Engine(), []);
  const controlRef = React.useRef<MapControl>();
  const skyboxRef = React.useRef<Skybox>();

  React.useEffect(() => {
    engine.hooks.onInit.subscribe("MapControlStory", async () => {
      controlRef.current = new MapControl(engine.camera);
      skyboxRef.current = new Skybox(
        engine.renderer.gl,
        engine.scene,
        "example"
      );

      addBasic(engine, await GLTFLoader.load(engine.gl, sCiv));

      const path = new Mesh(engine.gl, {
        geometry: new Geometry(engine.gl, {
          position: {
            size: 3,
            data: new Float32Array(20).fill(0),
            usage: engine.gl.DYNAMIC_DRAW,
          },
        }),
        mode: engine.gl.LINES,
        program: createPathMaterialProgram(engine),
      });
      engine.scene.addChild(path);

      setTimeout(() => {
        (path.geometry.attributes.position.data as Float32Array)
          .fill(0)
          .set([0, 0, 0, 1, 0, 1, -1, 0, 2]);

        path.geometry.attributes.position.needsUpdate = true;
      }, 1000);
    });

    engine.hooks.onUpdate.subscribe("MapControlStory", () => {
      controlRef.current!.update();
    });
  }, [engine]);

  return <OglCanvas engine={engine} />;
};

export default {
  title: "OGL / Path Drawing",
  parameters: {
    layout: "fullscreen",
  },
} as Meta;

const Template: StoryFn = () => (
  <div id="root">
    <Styles>
      <PathStory />
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {};
