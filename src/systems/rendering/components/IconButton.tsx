import clsx from "clsx";
import React from "react";
import { nano } from "../../../style";

const styles = nano.sheet({
  root: {
    "*": {
      height: "100%",
      width: "100%",
    },
    appearance: "none",
    background: "#000",
    borderRadius: "4px",
    border: "1px solid #fff",
    color: "#fff",
    cursor: "pointer",
    height: "32px",
    padding: "8px",
    width: "32px",
  },
});

export const IconButton: React.FC<React.HTMLAttributes<HTMLButtonElement>> = (
  props
) => (
  <button
    type="button"
    {...props}
    // eslint-disable-next-line react/destructuring-assignment
    className={clsx(styles.root, props?.className)}
  />
);
IconButton.displayName = "IconButton";
