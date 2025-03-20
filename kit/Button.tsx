import clsx from "clsx";
import React from "react";
import styles from "./Button.scss";
import type { BaseButtonProps } from "./BaseButton";
import { BaseButton } from "./BaseButton";

export interface ButtonProps extends BaseButtonProps {}

export const Button: React.FC<ButtonProps> = ({ className, ...props }) => (
  <BaseButton {...props} className={clsx(styles.root, className, {})} />
);
Button.displayName = "Button";
