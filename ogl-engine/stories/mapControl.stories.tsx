import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import type { OGLCallback } from "ogl-engine/OglCanvas";
import { OglCanvas } from "ogl-engine/OglCanvas";
import sCiv from "@assets/models/ships/sCiv_1.glb";
import { AxesHelper, GLTFLoader } from "ogl";
import { addBasic } from "@ogl-engine/loaders/basic/basic";
import { MapControl } from "@ogl-engine/mapControl";

const ModelStory: React.FC = () => {
  const controlRef = React.useRef<MapControl>();

  const onInit: OGLCallback = async ({ gl, camera, scene, canvas }) => {
    controlRef.current = new MapControl(camera, canvas);
    camera.position.set(5, 5, 5);
    const helper = new AxesHelper(gl, {});
    helper.setParent(scene);

    addBasic(gl, await GLTFLoader.load(gl, sCiv), scene, false);
  };

  const onUpdate: OGLCallback = () => {
    controlRef.current!.update();
  };

  return <OglCanvas onInit={onInit} onUpdate={onUpdate} />;
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
