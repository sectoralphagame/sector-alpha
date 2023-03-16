import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { Styles } from "@kit/theming/style";
import { PureEntity } from "@core/entity";
import { addStorage, createCommodityStorage } from "@core/components/storage";
import { Storage } from "./Storage";
import type { StorageProps } from "./Storage";
import { PanelComponent } from "../Panel/PanelComponent";

export default {
  title: "Panel / Storage",
  component: PanelComponent,
  parameters: {
    layout: "fullscreen",
  },
} as Meta<typeof PanelComponent>;

const Template: StoryFn<typeof Storage> = (args) => (
  <div id="root">
    <Styles>
      <PanelComponent
        isCollapsed={false}
        onCollapseToggle={action("onCollapseToggle")}
        onConfig={action("onConfig")}
        onFocus={action("onFocus")}
        onPause={action("onPause")}
        onPlay={action("onPlay")}
        onSpeed={action("onSpeed")}
      >
        <Storage {...args} />
        <hr />
        Next panel element
        <hr />
        Next panel element
      </PanelComponent>
    </Styles>
  </div>
);

export const Default = Template.bind({});
const defaultEntity = new PureEntity();
defaultEntity.components.storage = createCommodityStorage(10000);
(
  [
    { commodity: "drones", quantity: 100 },
    { commodity: "fuel", quantity: 2301 },
    { commodity: "electronics", quantity: 1087 },
  ] as const
).forEach(({ commodity, quantity }) => {
  addStorage(defaultEntity.components.storage!, commodity, quantity);
});
Default.args = {
  entity: defaultEntity,
} as StorageProps;
