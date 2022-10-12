import { Listbox } from "@headlessui/react";
import clsx from "clsx";
import React from "react";
import { nano, theme } from "../style";

const styles = nano.sheet({
  button: {
    "&:hover": {
      background: "rgba(255, 255, 255, 0.2)",
    },
    appearance: "none",
    background: "rgba(255, 255, 255, 0.1)",
    border: "none",
    borderRadius: "4px",
    color: theme.palette.default,
    cursor: "pointer",
    display: "block",
    fontSize: theme.typography.button,
    height: "32px",
    lineHeight: 1,
    padding: theme.spacing(1),
    outline: 0,
    textAlign: "left",
    width: "100%",
  },
  buttonActive: {
    background: "rgba(255, 255, 255, 0.2)",
  },
  dropdown: {
    background: theme.palette.background,
    border: `1px ${theme.palette.default} solid`,
    borderRadius: "8px",
    maxHeight: "300px",
    overflow: "scroll",
    outline: 0,
    padding: theme.spacing(1),
    position: "absolute",
    width: "100%",
    zIndex: 1,
  },
  option: {
    "&:hover": {
      background: "rgba(255, 255, 255, 0.15)",
    },
    borderRadius: "4px",
    cursor: "pointer",
    display: "block",
    fontSize: theme.typography.button,
    height: "32px",
    lineHeight: 1,
    padding: theme.spacing(1),
  },
  optionActive: {
    background: "rgba(255, 255, 255, 0.15)",
  },
  root: {
    position: "relative",
  },
});

export const Select: React.FC<{
  className?: string;
  value: string;
  // eslint-disable-next-line no-unused-vars
  onChange: (value: any) => void;
}> = ({ children, className, ...props }) => (
  <Listbox as="div" className={clsx(styles.root, className)} {...props}>
    {children}
  </Listbox>
);
export const SelectButton: React.FC<{ className?: string }> = ({
  className,
  ...props
}) => (
  <Listbox.Button
    className={({ open }) =>
      clsx(className, styles.button, {
        [styles.buttonActive]: open,
      })
    }
    {...props}
  />
);
export const SelectOptions: React.FC = (props) => (
  <Listbox.Options className={styles.dropdown} {...props} />
);
export const SelectOption: React.FC<{ value: string }> = (props) => (
  <Listbox.Option
    className={({ active }) =>
      clsx(styles.option, {
        [styles.optionActive]: active,
      })
    }
    {...props}
  />
);
