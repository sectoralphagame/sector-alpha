import React, { useEffect } from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { OglCanvas } from "ogl-engine/OglCanvas";
import { Orbit, Vec3 } from "ogl";
import type { Star } from "@ogl-engine/loaders/star/star";
import { addStar } from "@ogl-engine/loaders/star/star";
import Color from "color";
import { Skybox } from "@ogl-engine/loaders/skybox/skybox";
import type { OGLCallback } from "@ogl-engine/useOgl";

interface StarStoryProps {
  color: string;
}

const StarStory: React.FC<StarStoryProps> = ({ color: colorProp }) => {
  const starRef = React.useRef<Star>();
  const skyboxRef = React.useRef<Skybox>();
  const controlRef = React.useRef<Orbit>();

  const color = new Vec3(...Color(colorProp).rgb().array()).divide(255);

  useEffect(() => {
    if (!starRef.current) return;
    starRef.current.program.uniforms.vColor.value = color;
  }, [color]);

  const onInit: OGLCallback = React.useCallback(
    async ({ gl, camera, scene }) => {
      controlRef.current = new Orbit(camera);
      camera.position.set(50, 50, 50);
      camera.far = 1e5;
      skyboxRef.current = new Skybox(gl, scene, "example");

      starRef.current = await addStar(gl, scene, color);
    },
    []
  );

  const onUpdate: OGLCallback = React.useCallback(() => {
    controlRef.current!.update();

    starRef.current!.transform.rotation.y += 0.001;
  }, []);

  return <OglCanvas onInit={onInit} onUpdate={onUpdate} />;
};

export default {
  title: "OGL / Star",
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    color: {
      control: { type: "color" },
    },
  },
} as Meta;

const Template: StoryFn<StarStoryProps> = ({ color }) => (
  <div id="root">
    <Styles>
      <StarStory color={color} />
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {
  color: "#ff6800",
} as StarStoryProps;
