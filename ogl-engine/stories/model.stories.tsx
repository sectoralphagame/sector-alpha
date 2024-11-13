import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { OglCanvas } from "ogl-engine/OglCanvas";
import type { Mesh } from "ogl";
import { GLTFLoader, Orbit } from "ogl";
import { addBasic } from "@ogl-engine/materials/basic/basic";
import models from "@assets/models";
import { Skybox } from "@ogl-engine/materials/skybox/skybox";
import { Engine } from "@ogl-engine/engine/engine";

interface ModelStoryProps {
  model: string;
}

const ModelStory: React.FC<ModelStoryProps> = ({ model: modelName }) => {
  const engine = React.useMemo(() => new Engine(), []);
  const meshRef = React.useRef<Mesh>();
  const skyboxRef = React.useRef<Skybox>();
  const controlRef = React.useRef<Orbit>();

  React.useEffect(() => {
    engine.hooks.onInit.subscribe("ModelStory", async () => {
      controlRef.current = new Orbit(engine.camera, {
        inertia: 0.8,
      });

      skyboxRef.current = new Skybox(
        engine.renderer.gl,
        engine.scene,
        "example"
      );

      GLTFLoader.load(engine.renderer.gl, models[modelName]).then((model) => {
        meshRef.current = addBasic(engine, model);
        meshRef.current.setParent(engine.scene);
      });
    });

    engine.hooks.onUpdate.subscribe("ModelStory", () => {
      controlRef.current!.update();
    });
  }, []);

  React.useEffect(() => {
    if (engine.initialized) {
      meshRef.current?.parent?.removeChild(meshRef.current);
      GLTFLoader.load(engine.renderer.gl, models[modelName]).then((model) => {
        meshRef.current = addBasic(engine, model);
        meshRef.current.setParent(engine.scene);
      });
    }
  }, [modelName]);

  return <OglCanvas engine={engine} />;
};

export default {
  title: "OGL / Model",
  parameters: {
    layout: "fullscreen",
  },
  args: {
    model: Object.keys(models)[0],
  },
  argTypes: {
    model: {
      options: Object.keys(models).map((m) => m.replace(/\//, "-")),
      control: { type: "select" },
    },
  },
} as Meta;

const Template: StoryFn<ModelStoryProps> = ({ model }) => (
  <div id="root">
    <Styles>
      <ModelStory model={model.replace(/-/, "/")} />
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {
  model: "ship-lMil",
} as ModelStoryProps;
