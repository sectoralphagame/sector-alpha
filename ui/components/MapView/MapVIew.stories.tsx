import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { PureEntity } from "@core/entity";
import type { MapViewComponentProps } from "./MapViewComponent";
import { MapViewComponent } from "./MapViewComponent";
import { MapPanel } from "../MapPanel";
import { MapPanelButton, MapPanelTabContent } from "../MapPanel/MapPanelButton";

export default {
  title: "Map Panel / Legend",
  component: MapViewComponent,
  parameters: {
    layout: "fullscreen",
  },
} as Meta<typeof MapViewComponent>;

const Template: StoryFn<typeof MapViewComponent> = (args) => (
  <div id="root">
    <Styles>
      <MapPanel initialExpanded tabs={<MapPanelButton>Legend</MapPanelButton>}>
        <MapPanelTabContent>
          <MapViewComponent {...args} />
        </MapPanelTabContent>
      </MapPanel>
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {
  factions: ["#00ff00", "#ff00ff", "#ff0000"].map((color) => {
    const entity = new PureEntity();
    entity.components = {
      name: { value: `Faction ${color}`, name: "name" },
      color: { value: color, name: "color" },
    };

    return entity;
  }),
} as Partial<MapViewComponentProps>;
