import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { merge } from "lodash";
import type { Engine } from "@ogl-engine/engine/engine";
import { BaseMesh } from "@ogl-engine/engine/BaseMesh";
import { assetLoader } from "@ogl-engine/AssetLoader";
import { PbrMaterial } from "@ogl-engine/materials/pbr/pbr";
import {
  EntityIndicator,
  entityScale,
} from "@ui/components/TacticalMap/EntityMesh";
import models from "@assets/models";
import Color from "color";
import type { DockSize } from "@core/components/dockable";
import { Story3d, story3dMeta } from "./Story3d";
import type { Story3dArgs } from "./Story3d";

const EntityIndicatorStory: React.FC<
  Story3dArgs & {
    color: string;
    hovered: boolean;
    selected: boolean;
    size: DockSize;
  }
> = ({ postProcessing, skybox, color, hovered, selected, size, pane }) => {
  const engineRef = React.useRef<Engine>();
  const onInit = React.useCallback(async (engine) => {
    engineRef.current = engine;
    engine.camera.position.set(1, 1, 1);

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

    const indicator = new EntityIndicator(engine);
    indicator.material.setColor(Color(color).rgbNumber());
    // @ts-expect-error
    indicator.setParent(ship);
    indicator.material.setSize(size);
    indicator.material.uniforms.uShield.value = 0.5;
    indicator.material.uniforms.uHp.value = 1;
  }, []);

  React.useEffect(() => {
    if (!engineRef.current) return;

    let indicator: EntityIndicator | undefined;

    engineRef.current.scene.traverse((child) => {
      if (child instanceof EntityIndicator) {
        indicator = child;
      }
    });

    indicator?.material.setColor(Color(color).rgbNumber());
    indicator?.material.setHovered(hovered);
    indicator?.material.setSelected(selected);
  }, [color, hovered, selected]);

  return (
    <Story3d
      postProcessing={postProcessing}
      onEngineInit={onInit}
      onEngineUpdate={() => {}}
      skybox={skybox}
      pane={pane}
    />
  );
};

export default {
  title: "OGL / Entity Indicator",
  ...merge(
    {
      args: {
        color: "#ff0000",
        hovered: false,
        selected: false,
        size: "medium",
      },
      argTypes: {
        color: {
          control: {
            type: "color",
          },
        },
        hovered: {
          control: {
            type: "boolean",
          },
        },
        selected: {
          control: {
            type: "boolean",
          },
        },
        size: {
          control: {
            type: "select",
          },
          options: ["small", "medium", "large"] as DockSize[],
        },
      },
    },
    story3dMeta
  ),
} as Meta;

const Template: StoryFn = ({
  postProcessing,
  skybox,
  color,
  hovered,
  selected,
  size,
  pane,
}) => (
  <div id="root">
    <Styles>
      <EntityIndicatorStory
        postProcessing={postProcessing}
        skybox={skybox}
        color={color}
        hovered={hovered}
        selected={selected}
        size={size}
        pane={pane}
      />
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {};
