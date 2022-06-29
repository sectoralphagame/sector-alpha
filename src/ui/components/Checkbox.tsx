import clsx from "clsx";
import React from "react";
import { nano } from "../../style";

const styles = nano.sheet({
  root: {
    cursor: "pointer",
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
