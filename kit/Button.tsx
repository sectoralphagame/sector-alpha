import clsx from "clsx";
import React from "react";
import styles from "./Button.scss";
import type { BaseButtonProps } from "./BaseButton";
import { BaseButton } from "./BaseButton";

export interface ButtonProps extends BaseButtonProps {
  color?: "primary" | "secondary" | "error" | "success" | "none";
}

export const Button: React.FC<ButtonProps> = ({
  className,
  color = "none",
  ...props
}) => (
  <BaseButton
    {...props}
    className={clsx(styles.root, className, {
      [styles.primary]: color === "primary",
      [styles.secondary]: color === "secondary",
      [styles.error]: color === "error",
      [styles.success]: color === "success",
    })}
  />
);
Button.displayName = "Button";
