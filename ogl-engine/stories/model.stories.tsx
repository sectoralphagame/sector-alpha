import React, { useCallback } from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { OglCanvas } from "ogl-engine/OglCanvas";
import { GLTFLoader, Orbit } from "ogl";
import models from "@assets/models";
import { Skybox } from "@ogl-engine/materials/skybox/skybox";
import { Engine } from "@ogl-engine/engine/engine";
import { BaseMesh } from "@ogl-engine/engine/BaseMesh";
import { SimplePbrMaterial } from "@ogl-engine/materials/simplePbr/simplePbr";

interface ModelStoryProps {
  model: string;
}

const ModelStory: React.FC<ModelStoryProps> = ({ model: modelName }) => {
  const engine = React.useMemo(() => new Engine(), []);
  const meshRef = React.useRef<BaseMesh>();
  const skyboxRef = React.useRef<Skybox>();
  const controlRef = React.useRef<Orbit>();
  const load = useCallback((m: keyof typeof models) => {
    GLTFLoader.load(engine.renderer.gl, m).then((model) => {
      meshRef.current = BaseMesh.fromGltf(engine, model, {
        material: model.materials?.[0]
          ? new SimplePbrMaterial(engine, model.materials[0])
          : undefined,
      });
      meshRef.current.setParent(engine.scene);
    });
  }, []);

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

      load(models[modelName]);
    });

    engine.hooks.onUpdate.subscribe("ModelStory", () => {
      controlRef.current!.update();
    });
  }, []);

  React.useEffect(() => {
    if (engine.initialized) {
      meshRef.current?.parent?.removeChild(meshRef.current);
      load(models[modelName]);
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
