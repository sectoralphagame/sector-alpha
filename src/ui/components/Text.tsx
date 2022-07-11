import clsx from "clsx";
import React from "react";
import { nano, theme } from "../../style";

export type TextVariant = "default" | "h1" | "h2";

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TextVariant;
}

const Components: Record<TextVariant, React.ElementType> = {
  default: "p",
  h1: "h1",
  h2: "h2",
};

const styles = nano.sheet({
  default: {
    fontSize: theme.typography.default,
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  h1: { fontSize: theme.typography.header, marginBottom: theme.spacing(2) },
  h2: { fontSize: theme.typography.header2, marginBottom: theme.spacing(1) },
  root: {
    margin: "0",
  },
});

const Text: React.FC<TextProps> = ({
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
      })}
      {...props}
    />
  );
};

Text.displayName = "Text";
export default Text;
