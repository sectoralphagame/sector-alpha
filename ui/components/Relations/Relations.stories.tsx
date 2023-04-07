import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import type { RelationsComponentProps } from "./RelationsComponent";
import { RelationsComponent } from "./RelationsComponent";
import { MapPanel } from "../MapPanel";
import { MapPanelButton, MapPanelTabContent } from "../MapPanel/MapPanelButton";

export default {
  title: "Map Panel / Relations",
  component: RelationsComponent,
  parameters: {
    layout: "fullscreen",
  },
} as Meta<typeof RelationsComponent>;

const Template: StoryFn<typeof RelationsComponent> = (args) => (
  <div id="root">
    <Styles>
      <MapPanel
        initialExpanded
        tabs={<MapPanelButton>Relations</MapPanelButton>}
      >
        <MapPanelTabContent>
          <RelationsComponent {...args} />
        </MapPanelTabContent>
      </MapPanel>
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {
  factions: ["#00ff00", "#ff00ff", "#ff0000", "#00ffff", "#ffff00"].map(
    (color, index) => ({
      slug: `F-${index}`,
      color,
      relation: (index - 2) * 25,
    })
  ),
} as Partial<RelationsComponentProps>;
