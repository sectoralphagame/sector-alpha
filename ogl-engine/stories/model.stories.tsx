import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { OglCanvas } from "ogl-engine/OglCanvas";
import { GLTFLoader, Mesh, Orbit } from "ogl";
import { createBasicProgram } from "@ogl-engine/loaders/basic/basic";
import models from "@assets/models";
import { Skybox } from "@ogl-engine/loaders/skybox/skybox";
import type { OGLCallback } from "@ogl-engine/useOgl";

interface ModelStoryProps {
  model: string;
}

const ModelStory: React.FC<ModelStoryProps> = ({ model: modelName }) => {
  const meshRef = React.useRef<Mesh>();
  const skyboxRef = React.useRef<Skybox>();
  const controlRef = React.useRef<Orbit>();

  const onInit: OGLCallback = async ({ gl, camera, scene }) => {
    controlRef.current = new Orbit(camera);
    camera.position.set(5, 5, 5);
    camera.far = 1e5;
    skyboxRef.current = new Skybox(gl, scene, "example");

    const model = await GLTFLoader.load(gl, models[modelName]);
    meshRef.current = new Mesh(gl, {
      geometry: model.meshes[0].primitives[0].geometry,
      program: createBasicProgram(gl, model.materials[0]),
    });
    meshRef.current.setParent(scene, true);
  };

  const onUpdate: OGLCallback = () => {
    controlRef.current!.update();

    meshRef.current!.rotation.y += 0.001;
  };

  return <OglCanvas onInit={onInit} onUpdate={onUpdate} />;
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
