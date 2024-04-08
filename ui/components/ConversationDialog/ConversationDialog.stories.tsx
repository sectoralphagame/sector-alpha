import { Styles } from "@kit/theming/style";
import type { StoryFn } from "@storybook/react";
import React from "react";

import { action } from "@storybook/addon-actions";
import type { ConversationDialogProps } from "./ConversationDialog";
import { ConversationDialog } from "./ConversationDialog";
import conversation from "../../../core/world/data/missions/main/ffw/tutorial-miner.yml";

export default {
  title: "Dialogs / Conversation",
  component: ConversationDialog,
  parameters: {
    layout: "fullscreen",
  },
};

const Template: StoryFn<ConversationDialogProps> = (args) => (
  <div id="root">
    <Styles>
      <ConversationDialog {...args} />
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {
  open: true,
  conversation,
  onEnd: action("onEnd"),
};
