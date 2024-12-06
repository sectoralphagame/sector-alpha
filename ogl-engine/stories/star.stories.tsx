import React, { useEffect } from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { OglCanvas } from "ogl-engine/OglCanvas";
import { GLTFLoader, Orbit, Vec3 } from "ogl";
import { StarMaterial } from "@ogl-engine/materials/star/star";
import Color from "color";
import { Skybox } from "@ogl-engine/materials/skybox/skybox";
import { Engine } from "@ogl-engine/engine/engine";
import { BaseMesh } from "@ogl-engine/engine/BaseMesh";
import starModel from "@assets/models/world/star.glb";

interface StarStoryProps {
  color: string;
}

const StarStory: React.FC<StarStoryProps> = ({ color: colorProp }) => {
  const engine = React.useMemo(() => new Engine(), []);
  const starRef = React.useRef<BaseMesh<StarMaterial>>();
  const skyboxRef = React.useRef<Skybox>();
  const controlRef = React.useRef<Orbit>();

  const color = new Vec3(...Color(colorProp).rgb().array()).divide(255);

  useEffect(() => {
    if (!starRef.current) return;
    starRef.current.material.setColor(color);
  }, [color]);

  useEffect(() => {
    engine.hooks.onInit.subscribe("StarStory", async () => {
      controlRef.current = new Orbit(engine.camera);

      skyboxRef.current = new Skybox(engine, engine.scene, "example");
      starRef.current = BaseMesh.fromGltf<StarMaterial>(
        engine,
        await GLTFLoader.load(engine.gl, starModel)
      );
      engine.scene.addChild(starRef.current);
      starRef.current.applyMaterial(new StarMaterial(engine));
      starRef.current.material.setColor(color);
    });

    engine.hooks.onUpdate.subscribe("StarStory", () => {
      controlRef.current!.update();

      if (starRef.current) {
        starRef.current.rotation.y += 0.001;
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
