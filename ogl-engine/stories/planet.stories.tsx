import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { Orbit } from "ogl";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { merge } from "lodash";
import { Planet } from "@ogl-engine/builders/Planet";
import { assetLoader } from "@ogl-engine/AssetLoader";
import models from "@assets/models";
import type { Story3dArgs } from "./Story3d";
import { Story3d, story3dMeta } from "./Story3d";

interface PlanetStoryProps extends Story3dArgs {}

const PlanetStory: React.FC<PlanetStoryProps> = (props) => {
  const engineRef = React.useRef<Engine3D>();
  const planetRef = React.useRef<Planet>();
  const controlRef = React.useRef<Orbit>();

  const onInit = React.useCallback(async (engine: Engine3D) => {
    await assetLoader.getGltf(
      engine.gl,
      "world/planet",
      models["world/planet"]
    );
    engineRef.current = engine;
    planetRef.current = new Planet(engine, "ansura");
    planetRef.current.setParent(engine.scene);
    planetRef.current.updatePositionFromSphericalCoords(1, 0, 0);
    planetRef.current.createPaneFolder();
    controlRef.current = new Orbit(engine.camera, {
      inertia: 0.8,
    });
  }, []);

  const onUpdate = React.useCallback(() => {
    controlRef.current?.update();
  }, []);

  return <Story3d {...props} onEngineInit={onInit} onEngineUpdate={onUpdate} />;
};

export default {
  title: "OGL / Planet",
  ...merge({}, story3dMeta),
} as Meta;

const Template: StoryFn<PlanetStoryProps> = (props) => (
  <div id="root">
    <Styles>
      <PlanetStory {...props} />
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {} as PlanetStoryProps;
