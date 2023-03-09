import clsx from "clsx";
import React from "react";
import { Tab } from "@headlessui/react";
import styles from "./MapPanel.scss";

export const MapPanelButton: React.FC = ({ children }) => (
  <Tab as={React.Fragment}>
    {({ selected }) => (
      <button
        className={clsx(styles.btn, {
          [styles.btnActive]: selected,
        })}
        type="button"
      >
        {children}
      </button>
    )}
  </Tab>
);
MapPanelButton.displayName = "MapPanelButton";

export const MapPanelTabContent = Tab.Panel;
MapPanelTabContent.displayName = "MapPanelTabContent";
