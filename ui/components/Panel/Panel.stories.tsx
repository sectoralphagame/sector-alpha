import React from "react";
import { StoryFn, Meta } from "@storybook/react";
import { within, userEvent } from "@storybook/testing-library";
import { RecoilRoot, useSetRecoilState } from "recoil";
import { Styles } from "@kit/theming/style";
import { createShip } from "@core/archetypes/ship";
import { shipClasses } from "@core/world/ships";
import { matrix } from "mathjs";
import { Panel } from "./Panel";
import { Sim } from "../../../core/sim";
import { sim } from "../../atoms";

export default {
  title: "Example/Panel",
  component: Panel,
  parameters: {
    layout: "fullscreen",
  },
} as Meta<typeof Panel>;

let s = new Sim();
const SimSetter: React.FC = () => {
  s = new Sim();
  const setSim = useSetRecoilState(sim);
  React.useEffect(() => {
    s.init();
    s.next(1);
    setSim(s);
  }, []);

  return null;
};

const Template: StoryFn<typeof Panel> = (args) => (
  <Styles>
    <RecoilRoot>
      <SimSetter />
      <Panel {...args} />
      <div id="root" />
    </RecoilRoot>
  </Styles>
);

export const Ship = Template.bind({
  entity: createShip(s, {
    ...shipClasses[0],
    position: matrix([0, 0]),
    owner: undefined,
    sector: undefined,
  }),
});

export const Facility = Template.bind({});

// LoggedIn.play = async ({ canvasElement }) => {
//   const canvas = within(canvasElement);
//   const loginButton = await canvas.getByRole("button", { name: /Log in/i });
//   await userEvent.click(loginButton);
// };
