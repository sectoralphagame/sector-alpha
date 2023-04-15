// storybook stories for MissionDialog

import { Styles } from "@kit/theming/style";
import type { StoryFn } from "@storybook/react";
import React from "react";

import type { MissionDialogComponentProps } from "./MissionDialogComponent";
import { MissionDialogComponent } from "./MissionDialogComponent";

export default {
  title: "Dialogs / Mission",
  component: MissionDialogComponent,
  parameters: {
    layout: "fullscreen",
  },
};

const Template: StoryFn<MissionDialogComponentProps> = (args) => (
  <div id="root">
    <Styles>
      <MissionDialogComponent {...args} />
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {
  open: true,
  mission: {
    actorName: "Local Police",
    title: "Assist the local police",
    description:
      "This is the local police department. We have a surge in crime in Sector 5. Can you spare some of your fleet to patrol the area for the next 2 hours, Commander?",
    responses: [
      {
        text: "Understood, local police. We will deploy a team to Sector 5 immediately and provide assistance for the next 24 hours.",
        next: "Thank you, Commander. Your fleet's assistance in patrolling Sector 5 for the next 24 hours will greatly aid us in addressing the surge in crime. We appreciate your support.",
        type: "accept",
      },
      {
        text: "Apologies, local police, but we are currently understaffed and cannot spare any fleet to patrol Sector 5 at the moment.",
        next: "Understood, Commander. We will do our best to manage the situation in Sector 5 with our available resources, but additional assistance from your fleet would have been appreciated.",
        type: "decline",
      },
      {
        text: "Can you provide more information about the types of criminal activities in Sector 5? Are there any specific hotspots or patterns that we should be aware of?",
        next: "Certainly, Commander. Sector 5 has seen a sharp increase in criminal activities, including thefts and assaults. We need additional patrols to deter and respond to these incidents effectively.",
        type: "neutral",
      },
    ],
  },
};
