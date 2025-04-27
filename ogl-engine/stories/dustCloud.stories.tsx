import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { merge } from "lodash";
import { DustCloud } from "@ogl-engine/builders/DustCloud";
import { BaseMesh } from "@ogl-engine/engine/BaseMesh";
import { assetLoader } from "@ogl-engine/AssetLoader";
import { PbrMaterial } from "@ogl-engine/materials/pbr/pbr";
import { entityScale } from "@ui/components/TacticalMap/EntityMesh";
import models from "@assets/models";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { noop } from "@fxts/core";
import { Story3d, story3dMeta } from "./Story3d";
import type { Story3dArgs } from "./Story3d";

const DustCloudStory: React.FC<
  Story3dArgs & {
    size: number;
    density: number;
    color: string;
    alpha: number;
  }
> = ({ postProcessing, skybox, size, density, color, alpha }) => {
  const engineRef = React.useRef<Engine3D>();
  const onInit = React.useCallback(async (engine: Engine3D) => {
    await assetLoader.generateTextures();
    engineRef.current = engine;
    engine.camera.position.set(1, 1, 1);

    const asteroids = new DustCloud(engine, size, density);
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
      (c) => c instanceof DustCloud
    );
    asteroids?.setParent(null);

    const a = new DustCloud(engineRef.current, size, density);
    a.setParent(engineRef.current.scene);
    a.material.setColor(color);
    a.material.uniforms.uAlpha.value = alpha;

    return () => {
      a.setParent(null);
    };
  }, [size, density, color, alpha]);

  return (
    <Story3d
      postProcessing={postProcessing}
      control="map"
      onEngineInit={onInit}
      onEngineUpdate={() => {}}
      skybox={skybox}
    />
  );
};

export default {
  title: "OGL / DustCloud",
  ...merge(
    {
      args: {
        size: 10,
        density: 1,
        color: "#ff0000",
        alpha: 0.5,
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

const Template: StoryFn = ({
  postProcessing,
  skybox,
  size,
  density,
  color,
  alpha,
}) => (
  <div id="root">
    <Styles>
      <DustCloudStory
        postProcessing={postProcessing}
        skybox={skybox}
        size={size}
        density={density}
        color={color}
        alpha={alpha}
      />
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {};
