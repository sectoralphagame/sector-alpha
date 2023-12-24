import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { Styles } from "@kit/theming/style";
import { PureEntity } from "@core/entity";
import { addStorage, createCommodityStorage } from "@core/components/storage";
import { createTrade } from "@core/components/trade";
import { Offers } from "./Offers";
import type { OffersProps } from "./Offers";
import { PanelComponent } from "../Panel/PanelComponent";

export default {
  title: "Panel / Offers",
  component: PanelComponent,
  parameters: {
    layout: "fullscreen",
  },
} as Meta<typeof PanelComponent>;

const Template: StoryFn<typeof Offers> = (args) => (
  <div id="root">
    <Styles>
      <PanelComponent
        isCollapsed={false}
        onCollapseToggle={action("onCollapseToggle")}
        onConfig={action("onConfig")}
        onFocus={action("onFocus")}
        onPause={action("onPause")}
        onPlayerAssets={action("onPlayerAssets")}
        onPlay={action("onPlay")}
        onSpeed={action("onSpeed")}
      >
        <Offers {...args} />
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
defaultEntity.components.trade = createTrade();
(
  [
    { commodity: "drones", quantity: 100 },
    { commodity: "fuel", quantity: 2301 },
    { commodity: "electronics", quantity: 1087 },
  ] as const
).forEach(({ commodity, quantity }) => {
  addStorage(defaultEntity.components.storage!, commodity, quantity);
  defaultEntity.components.trade!.offers[commodity] = {
    ...defaultEntity.components.trade!.offers[commodity],
    active: true,
    quantity: defaultEntity.components.storage!.availableWares[commodity],
  };
});
defaultEntity.components.trade!.offers.food = {
  ...defaultEntity.components.trade!.offers.food,
  active: true,
  quantity: 4023,
  type: "buy",
};
Default.args = {
  entity: defaultEntity,
  onManage: undefined,
} as OffersProps;

export const PlayerOwned = Template.bind({});
PlayerOwned.args = {
  entity: defaultEntity,
  onManage: action("onManage"),
} as OffersProps;
