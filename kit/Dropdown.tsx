import { Menu } from "@headlessui/react";
import clsx from "clsx";
import React from "react";
import styles from "./Dropdown.scss";

export const Dropdown: React.FC<React.HTMLProps<HTMLDivElement>> = ({
  className,
  ...props
}) => <Menu {...props} as="div" className={clsx(styles.root, className)} />;
export const DropdownButton: React.FC<
  React.PropsWithChildren<{ className?: string; disabled?: boolean }>
> = ({ className, disabled, ...props }) => (
  <Menu.Button
    className={({ open }) =>
      clsx(className, styles.button, {
        [styles.buttonActive]: open,
        [styles.buttonDisabled]: disabled,
      })
    }
    {...props}
  />
);
export const DropdownOptions: React.FC<
  React.PropsWithChildren<{ static?: boolean; direction?: "up" | "down" }>
> = ({ direction = "down", ...props }) => (
  <Menu.Items
    className={clsx(styles.dropdown, {
      [styles.dropdownUp]: direction === "up",
    })}
    {...props}
  />
);
export const DropdownOption: React.FC<
  React.PropsWithChildren<{
    disabled?: boolean;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
  }>
> = ({ children, onClick, ...props }) => (
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
