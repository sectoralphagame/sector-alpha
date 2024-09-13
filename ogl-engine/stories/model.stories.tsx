import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import type { OGLCallback } from "ogl-engine/OglCanvas";
import { OglCanvas } from "ogl-engine/OglCanvas";
import sCiv from "@assets/models/ships/sCiv_1.glb";
import type { GLTF } from "ogl";
import { GLTFLoader, Orbit } from "ogl";
import { addBasic } from "@ogl-engine/loaders/basic/basic";

interface ModelStoryProps {
  model: string;
}

const modelPaths = {
  sCiv,
};

const ModelStory: React.FC<ModelStoryProps> = ({ model: modelName }) => {
  const modelRef = React.useRef<GLTF>();
  const controlRef = React.useRef<Orbit>();

  const onInit: OGLCallback = async ({ gl, camera, scene }) => {
    controlRef.current = new Orbit(camera);
    camera.position.set(5, 5, 5);

    const model = await GLTFLoader.load(gl, modelPaths[modelName]);
    modelRef.current = model;
    addBasic(gl, model, scene, false);
  };

  const onUpdate: OGLCallback = () => {
    controlRef.current!.update();

    modelRef.current!.meshes[0].primitives[0].rotation.y += 0.001;
  };

  return <OglCanvas onInit={onInit} onUpdate={onUpdate} />;
};

export default {
  title: "OGL / Model",
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    model: {
      options: Object.keys(modelPaths),
      control: { type: "select" },
    },
  },
} as Meta;

const Template: StoryFn<ModelStoryProps> = ({ model }) => (
  <div id="root">
    <Styles>
      <ModelStory model={model} />
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {
  model: "sCiv",
} as ModelStoryProps;
