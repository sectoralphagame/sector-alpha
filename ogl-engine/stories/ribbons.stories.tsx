import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { merge } from "lodash";
import { BaseMesh } from "@ogl-engine/engine/BaseMesh";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { Plane } from "ogl";
import { RibbonGeometry } from "@ogl-engine/RibbonEmitter";
import { ColorMaterial } from "@ogl-engine/materials/color/color";
import { EngineTrailMaterial } from "@ogl-engine/materials/engineTrail/engineTrail";
import { Story3d, story3dMeta } from "./Story3d";
import type { Story3dArgs } from "./Story3d";

const n = 50;
const segments = new Float32Array(n * 4);

for (let i = 0; i < n; i++) {
  segments.set([i / n, 0, Math.sin(i) / n], i * 4);
}

interface RibbonsStoryProps extends Story3dArgs {}

const RibbonsStory: React.FC<RibbonsStoryProps> = (props) => {
  const engineRef = React.useRef<Engine3D>();
  const onInit = React.useCallback(async (engine: Engine3D) => {
    engineRef.current = engine;
    engine.camera.position.set(1, 1, 1);

    const ribbon = new BaseMesh(engine, {
      geometry: new RibbonGeometry(
        engine.gl,
        segments.length / 4,
        segments,
        0.05
      ),
      material: new EngineTrailMaterial(engine, "#ff00ff"),
    });
    ribbon.setParent(engine.scene);

    const plane = new BaseMesh(engine, {
      geometry: new Plane(engine.gl),
      material: new ColorMaterial(engine, {
        color: "#00ff00",
        shaded: false,
      }),
    });
    plane.scale.set(0.1);

    engine.scene.addChild(plane);
  }, []);

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
  title: "OGL / Ribbons",
  ...merge(
    {
      args: {},
      argTypes: {},
    },
    story3dMeta
  ),
} as Meta;

const Template: StoryFn<RibbonsStoryProps> = (props) => (
  <div id="root">
    <Styles>
      <RibbonsStory {...props} />
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {};
