import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { merge } from "lodash";
import { Asteroids } from "@ogl-engine/builders/Asteroids";
import { BaseMesh } from "@ogl-engine/engine/BaseMesh";
import { assetLoader } from "@ogl-engine/AssetLoader";
import { PbrMaterial } from "@ogl-engine/materials/pbr/pbr";
import { entityScale } from "@ui/components/TacticalMap/EntityMesh";
import models from "@assets/models";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { getFPoints } from "@core/archetypes/asteroidField";
import { noop } from "@fxts/core";
import type { MineableCommodity } from "@core/economy/commodity";
import { Story3d, story3dMeta } from "./Story3d";
import type { Story3dArgs } from "./Story3d";

interface AsteroidsStoryProps extends Story3dArgs {
  size: number;
  density: number;
}

const resources: MineableCommodity[] = ["fuelium", "goldOre", "ore"];

const AsteroidsStory: React.FC<AsteroidsStoryProps> = ({
  size,
  density,
  ...props
}) => {
  const engineRef = React.useRef<Engine3D>();
  const onInit = React.useCallback(async (engine: Engine3D) => {
    await assetLoader.generateTextures();
    engineRef.current = engine;
    engine.camera.position.set(1, 1, 1);

    const asteroids = new Asteroids(
      engine,
      size,
      density,
      getFPoints(size),
      resources
    );
    asteroids.setParent(engine.scene);

    const model = await assetLoader.getGltf(
      engine.gl,
      "ship/mCiv",
      models["ship/mCiv"]
    );
    const ship = new BaseMesh(engine, {
      geometry: model.geometry,
    });
    ship.applyMaterial(new PbrMaterial(engine, model.material));
    ship.scale.set(entityScale);
    ship.setParent(engine.scene);
  }, []);

  React.useEffect(() => {
    if (!engineRef.current) return noop;

    const asteroids = engineRef.current.scene.children.find(
      (c) => c instanceof Asteroids
    );
    asteroids?.setParent(null);

    const a = new Asteroids(
      engineRef.current,
      size,
      density,
      getFPoints(size),
      resources
    );
    a.setParent(engineRef.current.scene);

    return () => {
      a.setParent(null);
    };
  }, [size, density]);

  return (
    <Story3d
      {...props}
      control="map"
      onEngineInit={onInit}
      onEngineUpdate={() => {}}
    />
  );
};

export default {
  title: "OGL / Asteroids",
  ...merge(
    {
      args: {
        size: 10,
        density: 1,
      },
      argTypes: {
        color: {
          control: {
            type: "color",
          },
        },
      },
    },
    story3dMeta
  ),
} as Meta;

const Template: StoryFn<AsteroidsStoryProps> = (props) => (
  <div id="root">
    <Styles>
      <AsteroidsStory {...props} />
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {};
