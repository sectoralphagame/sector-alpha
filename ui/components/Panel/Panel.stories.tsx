import React from "react";
import { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { PanelComponent } from "./PanelComponent";

export default {
  title: "Panel / Root",
  component: PanelComponent,
  parameters: {
    layout: "fullscreen",
  },
} as Meta<typeof PanelComponent>;

const Template: StoryFn<typeof PanelComponent> = (args) => (
  <div id="root">
    <Styles>
      <PanelComponent {...args} />
    </Styles>
  </div>
);

export const Default = Template.bind({});
export const Expanded = Template.bind({});
Expanded.args = { isCollapsed: false };
