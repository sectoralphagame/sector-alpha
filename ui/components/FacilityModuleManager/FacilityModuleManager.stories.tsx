import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { Styles } from "@kit/theming/style";
import { facilityModules } from "@core/archetypes/facilityModule";
import { Sim } from "@core/sim";
import { Entity } from "@core/entity";
import { FacilityModuleManagerComponent } from "./FacilityModuleManagerComponent";

export default {
  title: "Dialogs / Facility Module Manager",
  component: FacilityModuleManagerComponent,
  parameters: {
    layout: "fullscreen",
  },
} as Meta<typeof FacilityModuleManagerComponent>;

const Template: StoryFn<typeof FacilityModuleManagerComponent> = (args) => (
  <div id="root">
    <Styles>
      <FacilityModuleManagerComponent {...args} />
    </Styles>
  </div>
);

const s = new Sim();

export const Default = Template.bind({});
Default.args = {
  open: true,
  blueprints: Object.values(facilityModules),
  queue: {
    name: "facilityModuleQueue",
    queue: [{ blueprint: Object.values(facilityModules)[3] }],
    building: { blueprint: Object.values(facilityModules)[2], progress: 0.34 },
  },
  facilityModules: [0, 2, 5, 6].map((index) =>
    Object.values(facilityModules)[index].create(s, new Entity(s))
  ),
};
