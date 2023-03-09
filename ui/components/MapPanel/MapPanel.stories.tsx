import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { Tab } from "@headlessui/react";
import { MapPanel } from "./MapPanel";
import { MapPanelButton } from "./MapPanelButton";

export default {
  title: "Map Panel / Root",
  component: MapPanel,
  parameters: {
    layout: "fullscreen",
  },
} as Meta<typeof MapPanel>;

const Template: StoryFn<typeof MapPanel> = () => (
  <div id="root">
    <Styles>
      <MapPanel
        tabs={
          <>
            <MapPanelButton>Tab 1</MapPanelButton>
            <MapPanelButton>Tab 2</MapPanelButton>
          </>
        }
      >
        <Tab.Panel>Lorem Ipsum</Tab.Panel>
        <Tab.Panel>Dolor Sit</Tab.Panel>
      </MapPanel>
    </Styles>
  </div>
);

export const Default = Template.bind({});
