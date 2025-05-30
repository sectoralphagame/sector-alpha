import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import type { SmokeParticleGenerator } from "@ogl-engine/particles/smoke";
import { merge } from "lodash";
import type { FireParticleGenerator } from "@ogl-engine/particles/fire";
import type { ParticleGeneratorType } from "@ogl-engine/particles";
import { particleGenerator } from "@ogl-engine/particles";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { OneShotParticleGenerator } from "@ogl-engine/ParticleGenerator";
import type { Story3dArgs } from "./Story3d";
import { Story3d, story3dMeta } from "./Story3d";

interface ParticleGeneratorStoryProps extends Story3dArgs {
  particles: number;
  type: ParticleGeneratorType;
}

const ParticleGeneratorStory: React.FC<ParticleGeneratorStoryProps> = ({
  particles,
  type,
  ...props
}) => {
  const engineRef = React.useRef<Engine3D>();
  const generatorRef = React.useRef<
    SmokeParticleGenerator | FireParticleGenerator
  >();
  const onInit = React.useCallback((engine) => {
    engineRef.current = engine;
    engine.camera.position.set(1, 1, 1);
    const constructor = particleGenerator[type];
    generatorRef.current = new constructor(engine);
    if (!(generatorRef.current instanceof OneShotParticleGenerator)) {
      generatorRef.current.spawnRate = particles;
    }
    engineRef.current!.scene.addChild(generatorRef.current);
  }, []);
  const onUpdate = React.useCallback((_, _delta) => {}, []);

  React.useEffect(() => {
    if (
      generatorRef.current &&
      !(generatorRef.current instanceof OneShotParticleGenerator)
    )
      generatorRef.current.spawnRate = particles;
  }, [particles]);

  React.useEffect(() => {
    if (!engineRef.current) return;

    generatorRef.current?.destroy();
    generatorRef.current?.setParent(null);

    const constructor = particleGenerator[type];
    generatorRef.current = new constructor(engineRef.current);
    generatorRef.current.spawnRate = particles;
    generatorRef.current.setParent(engineRef.current.scene);
  }, [type]);

  return <Story3d {...props} onEngineInit={onInit} onEngineUpdate={onUpdate} />;
};

export default {
  title: "OGL / Particles",
  ...merge(
    {
      args: {
        particles: 10,
        type: "smoke",
      },
      argTypes: {
        type: {
          options: Object.keys(particleGenerator),
          control: {
            type: "select",
          },
        },
      },
    },
    story3dMeta
  ),
} as Meta;

const Template: StoryFn<ParticleGeneratorStoryProps> = (props) => (
  <div id="root">
    <Styles>
      <ParticleGeneratorStory {...props} />
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {};
