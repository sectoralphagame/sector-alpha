import clsx from "clsx";
import React from "react";
import styles from "./Text.scss";

export type TextColor = "default" | "disabled";
export type TextVariant = "default" | "h1" | "h2" | "caption";

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  color?: TextColor;
  variant?: TextVariant;
}

const Components: Record<TextVariant, React.ElementType> = {
  default: "p",
  h1: "h1",
  h2: "h2",
  caption: "small",
};

const Text: React.FC<TextProps> = ({
  color = "default",
  variant = "default",
  className,
  ...props
}) => {
  const Component = Components[variant];

  return (
    <Component
      className={clsx(className, styles.root, {
        [styles.defaultFont]: variant === "default",
        [styles.h1]: variant === "h1",
        [styles.h2]: variant === "h2",
        [styles.caption]: variant === "caption",
        [styles.colorDefault]: color === "default",
        [styles.colorDisabled]: color === "disabled",
      })}
      {...props}
    />
  );
};

Text.displayName = "Text";
export default Text;
