import { Listbox } from "@headlessui/react";
import clsx from "clsx";
import React from "react";
import styles from "./Select.scss";

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
