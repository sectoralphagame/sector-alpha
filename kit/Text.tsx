import clsx from "clsx";
import React from "react";
import { nano } from "../ui/style";

export type TextColor = "default" | "disabled";
export type TextVariant = "default" | "h1" | "h2";

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  color?: TextColor;
  variant?: TextVariant;
}

const Components: Record<TextVariant, React.ElementType> = {
  default: "p",
  h1: "h1",
  h2: "h2",
};

const styles = nano.sheet({
  colorDefault: {
    color: "var(--palette-default)",
  },
  colorDisabled: {
    color: "var(--palette-disabled)",
  },
  default: {
    fontSize: "var(--typography-default)",
    marginTop: "var(--spacing-1)",
    marginBottom: "var(--spacing-1)",
  },
  h1: {
    fontSize: "var(--typography-header)",
    marginBottom: "var(--spacing-2)",
  },
  h2: {
    fontSize: "var(--typography-header2)",
    marginBottom: "var(--spacing-1)",
  },
  root: {
    margin: "0",
  },
});

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
        [styles.default]: variant === "default",
        [styles.h1]: variant === "h1",
        [styles.h2]: variant === "h2",
        [styles.colorDefault]: color === "default",
        [styles.colorDisabled]: color === "disabled",
      })}
      {...props}
    />
  );
};

Text.displayName = "Text";
export default Text;
