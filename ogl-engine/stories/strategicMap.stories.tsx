import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { Sim } from "@core/sim";
import data from "@core/world/data/base.json";
import { StrategicMap } from "@ui/components/MapOverlay/StrategicMap";
import type { StrategicMapEngine } from "@ogl-engine/engine/engine2d";
import { pathPlanningSystem } from "@core/systems/pathPlanning";
import { gameStore } from "@ui/state/game";

const Game: React.FC = () => {
  const sim = React.useMemo<Sim>(
    () => Sim.load({ systems: [pathPlanningSystem] }, JSON.stringify(data)),
    []
  );
  const engineRef = React.useRef<StrategicMapEngine>();
  React.useEffect(() => {
    gameStore.setOverlay("map");
  }, []);

  return <StrategicMap sim={sim} engineRef={engineRef} close={() => {}} />;
};

const Template: StoryFn = () => (
  <div id="root">
    <Styles>
      <Game />
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {};

export default {
  title: "OGL / Strategic Map",
  parameters: {
    layout: "fullscreen",
  },
} as Meta;
