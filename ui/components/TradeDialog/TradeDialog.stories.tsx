import React from "react";
import type { StoryFn, Meta } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { Styles } from "@kit/theming/style";
import { FormProvider, useForm } from "react-hook-form";
import { TradeDialogComponent } from "./TradeDialogComponent";
import { PanelComponent } from "../Panel/PanelComponent";
import { TradeDialogLine } from "./TradeDialogLine";

export default {
  title: "Dialogs / Trade",
  component: PanelComponent,
  parameters: {
    layout: "fullscreen",
  },
} as Meta<typeof PanelComponent>;

const Wrapper: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const form = useForm();
  return <FormProvider {...form}>{children}</FormProvider>;
};

const Template: StoryFn = () => (
  <div id="root">
    <Styles>
      <Wrapper>
        <TradeDialogComponent
          canAccept
          total={1000}
          onClose={action("onClose")}
          onAccept={action("onAccept")}
          open
        >
          <TradeDialogLine
            availableQuantity={100}
            buyDisabled={false}
            commodity="drones"
            max={100}
            offerType="buy"
            hasAction
            price={100}
            sellDisabled={false}
          />
          <TradeDialogLine
            availableQuantity={100}
            buyDisabled={false}
            commodity="electronics"
            max={100}
            offerType="buy"
            hasAction
            price={100}
            sellDisabled={false}
          />
          <TradeDialogLine
            availableQuantity={100}
            buyDisabled={false}
            commodity="silica"
            max={100}
            offerType="buy"
            hasAction
            price={100}
            sellDisabled={false}
          />
        </TradeDialogComponent>
      </Wrapper>
    </Styles>
  </div>
);

export const Default = Template.bind({});
Default.args = {};
