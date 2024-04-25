import clsx from "clsx";
import React from "react";
import styles from "./Button.scss";
import type { BaseButtonProps } from "./BaseButton";
import { BaseButton } from "./BaseButton";

export interface ButtonProps extends BaseButtonProps {
  active?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  active,
  className,
  ...props
}) => (
  <BaseButton
    {...props}
    className={clsx(styles.root, className, {
      [styles.active]: active,
    })}
  />
);
Button.displayName = "Button";
