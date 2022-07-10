import clsx from "clsx";
import React from "react";
import { nano, theme } from "../../style";

const styles = nano.sheet({
  root: {
    "&:hover, &:focus": {
      background: "rgba(255, 255, 255, 0.15)",
    },
    "&:active": {
      background: "rgba(255, 255, 255, 0.3)",
    },
    appearance: "none",
    background: "#000",
    borderRadius: "4px",
    border: `1px solid ${theme.palette.default}`,
    color: theme.palette.default,
    height: "32px",
    padding: theme.spacing(1),
    lineHeight: 1,
    fontSize: theme.typography.button,
    fontWeight: 600,
    transition: "200ms",
    outline: 0,
  },
});

export const Input = React.forwardRef<
  HTMLInputElement,
  React.HTMLAttributes<HTMLInputElement>
>((props, ref) => (
  <input
    {...props}
    ref={ref}
    // eslint-disable-next-line react/destructuring-assignment
    className={clsx(styles.root, props?.className)}
  />
));
Input.displayName = "Input";
