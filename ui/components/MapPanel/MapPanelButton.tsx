import clsx from "clsx";
import React from "react";
import { Tab } from "@headlessui/react";
import { BaseButton } from "@kit/BaseButton";
import styles from "./MapPanel.scss";

export const MapPanelButton: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => (
  <Tab as={React.Fragment}>
    {({ selected }) => (
      <BaseButton
        className={clsx(styles.btn, {
          [styles.btnActive]: selected,
        })}
      >
        {children}
      </BaseButton>
    )}
  </Tab>
);
MapPanelButton.displayName = "MapPanelButton";

export const MapPanelTabContent = Tab.Panel;
MapPanelTabContent.displayName = "MapPanelTabContent";
