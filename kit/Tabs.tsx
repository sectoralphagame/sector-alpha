import React from "react";
import { Tab as HeadlessTab } from "@headlessui/react";
import clsx from "clsx";
import styles from "./Tabs.scss";

export const TabList: React.FC<{ className?: string }> = ({
  className,
  ...props
}) => <HeadlessTab.List className={clsx(className, styles.list)} {...props} />;

export const Tab: React.FC<{ className?: string }> = ({
  className,
  ...props
}) => (
  <HeadlessTab
    className={({ selected }) =>
      clsx(className, styles.tab, {
        [styles.tabActive]: selected,
      })
    }
    {...props}
  />
);

export const TabGroup = HeadlessTab.Group;
export const TabPanels = HeadlessTab.Panels;
export const TabPanel = HeadlessTab.Panel;
