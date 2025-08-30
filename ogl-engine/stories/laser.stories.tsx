import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { merge } from "lodash";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { LaserWeaponEffect } from "@ogl-engine/builders/LaserWeapon";
import { Transform } from "ogl";
import { AxesHelper } from "@ogl-engine/utils/AxesHelper";
import { Story3d, story3dMeta } from "./Story3d";
import type { Story3dArgs } from "./Story3d";

interface LaserStoryProps extends Story3dArgs {
  motion: boolean;
}

const LaserStory: React.FC<LaserStoryProps> = ({ motion, ...props }) => {
  const engineRef = React.useRef<Engine3D>();
  const intervalRef = React.useRef<number>();
  const onInit = React.useCallback(async (engine: Engine3D) => {
    engineRef.current = engine;
    engine.camera.position.set(1, 0, 0);
    engine.camera.lookAt([0, 0, 0]);

    const transform = new Transform();
    transform.name = "Container";
    transform.setParent(engine.scene);

    const target = new AxesHelper(engine);
    target.position.set(10, 0, 0);
    target.setParent(engine.scene);

    const laser = new LaserWeaponEffect(engine, {
      color: "rgb(54, 54, 255)",
      width: 0.1,
      id: 1,
    });
    laser.beam.material.createPaneSettings();
    laser.setParent(transform);
    laser.setTarget(target.position);

    const axes = new AxesHelper(engine, {
      symmetric: false,
      size: 1,
    });
    axes.setParent(transform);

    intervalRef.current = setInterval(() => {
      laser.fire();
    }, 3000) as unknown as number;
  }, []);

  const onUpdate = React.useCallback((engine: Engine3D) => {
    if (!motion) return;

    const transform = engine.scene.children.find(
      (c) => c.name === "Container"
    )!;
    transform.position.set(
      Math.sin(engine.uniforms.uTime.value) * 2,
      0,
      Math.cos(engine.uniforms.uTime.value) * 2
    );
    transform.updateMatrixWorld(true);
    // const laser = transform.children[0] as LaserWeaponEffect;
    // laser.target.y = Math.sin(engine.uniforms.uTime.value);
  }, []);

  React.useEffect(
    () => () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    },
    []
  );

  return <Story3d {...props} onEngineInit={onInit} onEngineUpdate={onUpdate} />;
};

export default {
  title: "OGL / Laser",
  ...merge(
    {
      args: {
        motion: false,
      },
      argTypes: {
        motion: {
          control: {
            type: "boolean",
          },
        },
      },
    },
    story3dMeta
  ),
} as Meta;

const Template: StoryFn<LaserStoryProps> = (props) => (
  <div id="root">
    <Styles>
      <LaserStory {...props} />
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {};
