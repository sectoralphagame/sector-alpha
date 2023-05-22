import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { Notification } from "./Notification";

export default {
  title: "Components / Notification",
  component: Notification,
  parameters: {
    layout: "fullscreen",
  },
} as Meta<typeof Notification>;

const Template: StoryFn<typeof Notification> = (args) => (
  <div id="root">
    <Styles>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "48px 0",
        }}
      >
        <Notification {...args} />
      </div>
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {
  message: "This is a notification",
};
