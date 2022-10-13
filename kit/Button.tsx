import clsx from "clsx";
import React from "react";
import { nano } from "../ui/style";

const styles = nano.sheet({
  root: {
    "&:hover, &:focus": {
      background: "rgba(255, 255, 255, 0.15)",
    },
    "&:active": {
      background: "rgba(255, 255, 255, 0.3)",
    },
    "&[disabled]": {
      "&:hover": {
        background: "var(--palette-background)",
      },
      borderColor: "var(--palette-disabled)",
      color: "var(--palette-disabled)",
      cursor: "auto",
    },
    appearance: "none",
    background: "var(--palette-background)",
    borderRadius: "4px",
    border: "1px solid var(--palette-default)",
    color: "var(--palette-default)",
    cursor: "pointer",
    height: "32px",
    padding: "var(--spacing-1)",
    textAlign: "center",
    whiteSpace: "nowrap",
    lineHeight: 1,
    textTransform: "uppercase",
    fontSize: "var(--typography-button)",
    fontWeight: 600,
    transition: "200ms",
    outline: 0,
  },
});

export const Button: React.FC<
  React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
> = (props) => {
  const ref = React.useRef<HTMLButtonElement>(null);

  return (
    <button
      type="button"
      {...props}
      ref={ref}
      onMouseUp={() => {
        ref.current?.blur();
      }}
      // eslint-disable-next-line react/destructuring-assignment
      className={clsx(styles.root, props?.className)}
    />
  );
};
Button.displayName = "Button";
