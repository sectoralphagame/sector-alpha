import clsx from "clsx";
import React from "react";
import { nano, theme } from "../style";

const styles = nano.sheet({
  root: {
    "&:checked:before": {
      position: "relative",
      content: "''",
      width: "6px",
      height: "6px",
      top: "2px",
      left: "2px",
      display: "block",
      background: theme.palette.default,
    },
    cursor: "pointer",
    appearance: "none",
    width: "12px",
    height: "12px",
    border: `1px solid ${theme.palette.default}`,
    borderRadius: "2px",
    margin: "2px",
  },
});

export const Checkbox: React.FC<
  React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >
> = (props) => {
  const ref = React.useRef<HTMLInputElement>(null);

  return (
    <input
      type="checkbox"
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
Checkbox.displayName = "Checkbox";
