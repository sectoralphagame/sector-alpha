import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { OglCanvas } from "ogl-engine/OglCanvas";
import sCiv from "@assets/models/ship/sCiv.glb";
import { AxesHelper, GLTFLoader } from "ogl";
import { addBasic } from "@ogl-engine/materials/basic/basic";
import { MapControl } from "@ogl-engine/MapControl";
import { Engine } from "@ogl-engine/engine/engine";
import { Skybox } from "@ogl-engine/materials/skybox/skybox";

const ModelStory: React.FC = () => {
  const engine = React.useMemo(() => new Engine(), []);
  const controlRef = React.useRef<MapControl>();
  const skyboxRef = React.useRef<Skybox>();

  React.useEffect(() => {
    engine.hooks.onInit.subscribe("MapControlStory", async () => {
      controlRef.current = new MapControl(engine.camera);
      const helper = new AxesHelper(engine.gl, {});
      helper.setParent(engine.scene);
      skyboxRef.current = new Skybox(
        engine.renderer.gl,
        engine.scene,
        "example"
      );

      addBasic(engine, await GLTFLoader.load(engine.gl, sCiv));
    });

    engine.hooks.onUpdate.subscribe("MapControlStory", () => {
      controlRef.current!.update();
    });
  }, [engine]);

  return <OglCanvas engine={engine} />;
};

export default {
  title: "OGL / Map Control",
  parameters: {
    layout: "fullscreen",
  },
} as Meta;

const Template: StoryFn = () => (
  <div id="root">
    <Styles>
      <ModelStory />
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {};
