import React from "react";
import { Tab as HeadlessTab } from "@headlessui/react";
import clsx from "clsx";
import { nano } from "../ui/style";

const styles = nano.sheet({
  list: {
    borderRadius: "4px",
    border: "1px solid var(--palette-default)",
    background: "var(--palette-background)",
  },
  tab: {
    "&:hover, &:focus": {
      background: "rgba(255, 255, 255, 0.15)",
    },
    "&:active": {
      background: "rgba(255, 255, 255, 0.3)",
    },
    appearance: "none",
    background: "transparent",
    border: "none",
    color: "var(--palette-default)",
    cursor: "pointer",
    height: "30px",
    padding: "var(--spacing-1)",
    textAlign: "center",
    whiteSpace: "nowrap",
    lineHeight: 1,
    textTransform: "uppercase",
    fontSize: "var(--typography-button)",
    fontWeight: 600,
    transition: "200ms",
    outline: 0,
  },
  tabActive: {
    "&:hover, &:focus": {
      background: "rgba(255, 255, 255, 0.6)",
    },
    "&:active": {
      background: "rgba(255, 255, 255, 0.8)",
    },
    background: "rgba(255, 255, 255, 0.5)",
  },
});

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
