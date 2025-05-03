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
  segments.set([i / n, 0, 0], i * 4);
}

const RibbonsStory: React.FC<Story3dArgs & {}> = ({
  postProcessing,
  skybox,
}) => {
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
      postProcessing={postProcessing}
      control="map"
      onEngineInit={onInit}
      onEngineUpdate={() => {}}
      skybox={skybox}
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

const Template: StoryFn = ({ postProcessing, skybox }) => (
  <div id="root">
    <Styles>
      <RibbonsStory postProcessing={postProcessing} skybox={skybox} />
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {};
