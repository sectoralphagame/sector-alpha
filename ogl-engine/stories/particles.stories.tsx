import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { SmokeParticleGenerator } from "@ogl-engine/particles/smoke";
import { merge } from "lodash";
import { assetLoader } from "@ogl-engine/AssetLoader";
import { FireParticleGenerator } from "@ogl-engine/particles/fire";
import type { Story3dArgs } from "./Story3d";
import { Story3d, story3dMeta } from "./Story3d";

assetLoader.loadTextures(() => {});

const ParticleGeneratorStory: React.FC<
  Story3dArgs & {
    particles: number;
    type: "smoke" | "fire";
  }
> = ({ postProcessing, skybox, particles, type }) => {
  const generatorRef = React.useRef<
    SmokeParticleGenerator | FireParticleGenerator
  >();
  const onInit = React.useCallback((engine) => {
    engine.camera.position.set(1, 1, 1);
    generatorRef.current = new (
      type === "smoke" ? SmokeParticleGenerator : FireParticleGenerator
    )(engine);
    generatorRef.current.spawnRate = particles;
  }, []);
  const onUpdate = React.useCallback((_, time) => {
    generatorRef.current?.update(time);
  }, []);

  React.useEffect(() => {
    if (generatorRef.current) generatorRef.current.spawnRate = particles;
  }, [particles]);

  return (
    <Story3d
      postProcessing={postProcessing}
      onEngineInit={onInit}
      onEngineUpdate={onUpdate}
      skybox={skybox}
    />
  );
};

export default {
  title: "OGL / Particles",
  ...merge(
    {
      args: {
        particles: 100,
        type: "smoke",
      },
      argTypes: {
        type: {
          options: ["smoke", "fire"],
          control: {
            type: "select",
          },
        },
      },
    },
    story3dMeta
  ),
} as Meta;

const Template: StoryFn = ({ postProcessing, particles, skybox, type }) => (
  <div id="root">
    <Styles>
      <ParticleGeneratorStory
        postProcessing={postProcessing}
        particles={particles}
        skybox={skybox}
        type={type}
      />
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {};
