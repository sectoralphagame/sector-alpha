import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { Styles } from "@kit/theming/style";
import { PureEntity } from "@core/entity";
import { Crew } from "./Crew";
import type { CrewProps } from "./Crew";
import { PanelComponent } from "../Panel/PanelComponent";

export default {
  title: "Panel / Crew",
  component: Crew,
  parameters: {
    layout: "fullscreen",
  },
} as Meta<typeof Crew>;

const Template: StoryFn<typeof Crew> = (args) => (
  <div id="root">
    <Styles>
      <PanelComponent
        isCollapsed={false}
        onCollapseToggle={action("onCollapseToggle")}
        onConfig={action("onConfig")}
        onFocus={action("onFocus")}
        onPlayerAssets={action("onPlayerAssets")}
      >
        <Crew {...args} />
        Next panel element
        <hr />
        Next panel element
      </PanelComponent>
    </Styles>
  </div>
);

export const Default = Template.bind({});
const defaultEntity = new PureEntity();
defaultEntity.components.crew = {
  mood: 10,
  name: "crew",
  workers: {
    current: 10,
    max: 20,
  },
};
Default.args = {
  entity: defaultEntity,
  requiredCrew: 100,
} as CrewProps;
