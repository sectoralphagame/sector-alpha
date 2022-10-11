import { Menu } from "@headlessui/react";
import clsx from "clsx";
import React from "react";
import { nano, theme } from "../../style";

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
    "&[disabled]": {
      "&:hover": {
        background: theme.palette.background,
      },
      borderColor: theme.palette.disabled,
      color: theme.palette.disabled,
      cursor: "auto",
    },
    background: "none",
    border: "none",
    borderRadius: "4px",
    color: theme.palette.default,
    cursor: "pointer",
    display: "block",
    fontSize: theme.typography.button,
    minHeight: "32px",
    lineHeight: 1,
    padding: theme.spacing(1),
    textAlign: "left",
    width: "100%",
  },
  optionActive: {
    background: "rgba(255, 255, 255, 0.15)",
  },
  root: {
    position: "relative",
  },
});

export const Dropdown: React.FC<React.HTMLProps<HTMLDivElement>> = ({
  className,
  ...props
}) => <Menu {...props} as="div" className={clsx(styles.root, className)} />;
export const DropdownButton: React.FC<{ className?: string }> = ({
  className,
  ...props
}) => (
  <Menu.Button
    className={({ open }) =>
      clsx(className, styles.button, {
        [styles.buttonActive]: open,
      })
    }
    {...props}
  />
);
export const DropdownOptions: React.FC<{ static?: boolean }> = (props) => (
  <Menu.Items className={styles.dropdown} {...props} />
);
export const DropdownOption: React.FC<{
  disabled?: boolean;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}> = ({ children, onClick, ...props }) => (
  <Menu.Item {...props}>
    {({ active, disabled }) => (
      <button
        className={clsx(styles.option, {
          [styles.optionActive]: active,
        })}
        disabled={disabled}
        type="button"
        onClick={onClick}
      >
        {children}
      </button>
    )}
  </Menu.Item>
);
