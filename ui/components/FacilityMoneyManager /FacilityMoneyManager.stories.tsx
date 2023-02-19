import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { facilityModules } from "@core/archetypes/facilityModule";
import { Sim } from "@core/sim";
import { Entity } from "@core/components/entity";
import { FacilityMoneyManagerComponent } from "./FacilityMoneyManagerComponent";

export default {
  title: "Dialogs / Facility Money Manager",
  component: FacilityMoneyManagerComponent,
  parameters: {
    layout: "fullscreen",
  },
} as Meta<typeof FacilityMoneyManagerComponent>;

const Template: StoryFn<typeof FacilityMoneyManagerComponent> = (args) => (
  <div id="root">
    <Styles>
      <FacilityMoneyManagerComponent {...args} />
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {
  open: true,
  availableMoney: 20000,
  neededMoney: 10000,
  currentMoney: 1000,
};
