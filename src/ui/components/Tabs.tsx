import React from "react";
import { Tab as HeadlessTab } from "@headlessui/react";
import clsx from "clsx";
import { nano, theme } from "../../style";

const styles = nano.sheet({
  list: {
    display: "flex",
    gap: theme.spacing(1),
  },
  tab: {
    "&:hover, &:focus": {
      background: "rgba(255, 255, 255, 0.15)",
    },
    "&:active": {
      background: "rgba(255, 255, 255, 0.3)",
    },
    appearance: "none",
    background: "#000",
    borderRadius: "4px",
    border: `1px solid ${theme.palette.default}`,
    color: theme.palette.default,
    cursor: "pointer",
    height: "32px",
    padding: theme.spacing(1),
    textAlign: "center",
    whiteSpace: "nowrap",
    lineHeight: 1,
    textTransform: "uppercase",
    fontSize: theme.typography.button,
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
