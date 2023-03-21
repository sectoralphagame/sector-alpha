import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { shipClasses } from "@core/world/ships";
import { sum } from "mathjs";
import type { Commodity } from "@core/economy/commodity";
import { getCommodityCost } from "@core/economy/utils";
import { facilityModules } from "@core/archetypes/facilityModule";
import { max } from "@fxts/core";
import { ShipyardDialogComponent } from "./ShipyardDialogComponent";

export default {
  title: "Dialogs / Shipyard",
  component: ShipyardDialogComponent,
  parameters: {
    layout: "fullscreen",
  },
} as Meta<typeof ShipyardDialogComponent>;

const Template: StoryFn<typeof ShipyardDialogComponent> = (args) => (
  <div id="root">
    <Styles>
      <ShipyardDialogComponent {...args} />
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {
  open: true,
  money: 2000000,
  blueprints: shipClasses.map((bp) => ({
    ...bp,
    cost: sum(
      Object.entries(bp.build.cost).map(
        ([commodity, quantity]) =>
          quantity *
          getCommodityCost(
            commodity as Commodity,
            Object.values(facilityModules),
            max
          ) *
          2
      )
    ),
  })),
};

export const Owned = Template.bind({});
Owned.args = {
  ...Default.args,
  showCommodityCost: true,
};
