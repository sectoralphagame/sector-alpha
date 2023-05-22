import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { Notification } from "./Notification";
import { NotificationContainer } from "./NotificationContainer";

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
      <NotificationContainer>
        <Notification {...args} />
      </NotificationContainer>
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {
  message: "This is a notification",
};
