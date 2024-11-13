import React, { useEffect } from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { OglCanvas } from "ogl-engine/OglCanvas";
import { Orbit, Vec3 } from "ogl";
import type { Star } from "@ogl-engine/materials/star/star";
import { addStar } from "@ogl-engine/materials/star/star";
import Color from "color";
import { Skybox } from "@ogl-engine/materials/skybox/skybox";
import { Engine } from "@ogl-engine/engine/engine";

interface StarStoryProps {
  color: string;
}

const StarStory: React.FC<StarStoryProps> = ({ color: colorProp }) => {
  const engine = React.useMemo(() => new Engine(), []);
  const starRef = React.useRef<Star>();
  const skyboxRef = React.useRef<Skybox>();
  const controlRef = React.useRef<Orbit>();

  const color = new Vec3(...Color(colorProp).rgb().array()).divide(255);

  useEffect(() => {
    if (!starRef.current) return;
    starRef.current.program.uniforms.vColor.value = color;
  }, [color]);

  useEffect(() => {
    engine.hooks.onInit.subscribe("StarStory", async () => {
      controlRef.current = new Orbit(engine.camera);

      skyboxRef.current = new Skybox(
        engine.renderer.gl,
        engine.scene,
        "example"
      );
      starRef.current = await addStar(engine, color);
    });

    engine.hooks.onUpdate.subscribe("StarStory", () => {
      controlRef.current!.update();

      if (starRef.current) {
        starRef.current.transform.rotation.y += 0.001;
      }
    });
  }, []);

  return <OglCanvas engine={engine} />;
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
  color: "#8c422b",
} as StarStoryProps;
