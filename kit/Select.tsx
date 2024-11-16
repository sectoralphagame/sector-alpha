import { Listbox } from "@headlessui/react";
import clsx from "clsx";
import React from "react";
import styles from "./Select.scss";
import { BaseButton, defaultClickSound, popSound } from "./BaseButton";

export const Select: React.FC<
  React.PropsWithChildren<{
    className?: string;
    disabled?: boolean;
    value: string;
    // eslint-disable-next-line no-unused-vars
    onChange: (value: any) => void;
  }>
> = ({ children, className, ...props }) => (
  <Listbox as="div" className={clsx(styles.root, className)} {...props}>
    {children}
  </Listbox>
);
export const SelectButton: React.FC<
  React.PropsWithChildren<{ className?: string }>
> = ({ className, ...props }) => (
  <Listbox.Button
    as={BaseButton}
    className={({ open }) =>
      clsx(className, styles.button, {
        [styles.buttonActive]: open,
      })
    }
    {...props}
  />
);
export const SelectOptions: React.FC<React.PropsWithChildren<{}>> = (props) => (
  <Listbox.Options className={styles.dropdown} {...props} />
);
export const SelectOption: React.FC<
  React.PropsWithChildren<{
    onClick?: React.MouseEventHandler<any>;
    onMouseEnter?: React.MouseEventHandler<any>;
    value: string;
  }>
> = ({ onClick, onMouseEnter, ...props }) => (
  <Listbox.Option
    className={({ active }) =>
      clsx(styles.option, {
        [styles.optionActive]: active,
      })
    }
    onClick={(event) => {
      defaultClickSound.play();
      if (onClick) {
        onClick(event);
      }
    }}
    onMouseEnter={(event) => {
      popSound.play();
      if (onMouseEnter) {
        onMouseEnter(event);
      }
    }}
    {...props}
  />
);
