import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { SimAvgTimeGraphComponent } from "./SimAvgTimeGraphComponent";

export default {
  title: "Dev / Average Sim Frame Time Graph",
  component: SimAvgTimeGraphComponent,
  parameters: {
    layout: "fullscreen",
  },
} as Meta<typeof SimAvgTimeGraphComponent>;

const Template: StoryFn<typeof SimAvgTimeGraphComponent> = (args) => (
  <div id="root">
    <Styles>
      <SimAvgTimeGraphComponent {...args} />
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {
  data: [4.31, 6.22, 4.11, 5.33, 4.44, 5.55, 4.66, 5.77, 4.88, 5.99],
  width: 300,
  height: 100,
};
