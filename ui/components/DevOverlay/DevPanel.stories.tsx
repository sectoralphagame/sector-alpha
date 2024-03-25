import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { coreActions } from "@core/actions/core";
import { action } from "@storybook/addon-actions";
import type { DevOverlayComponentProps } from "./DevOverlayComponent";
import { DevOverlayComponent } from "./DevOverlayComponent";

export default {
  title: "Overlays / Dev",
  component: DevOverlayComponent,
  parameters: {
    layout: "fullscreen",
  },
} as Meta<typeof DevOverlayComponent>;

const Template: StoryFn<typeof DevOverlayComponent> = (args) => (
  <div id="root">
    <Styles>
      <DevOverlayComponent {...args} />
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {
  actions: coreActions,
  onClose: action("onClose"),
  onReload: action("onReload"),
} as DevOverlayComponentProps;
