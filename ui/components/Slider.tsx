import clsx from "clsx";
import React from "react";
import { nano } from "../style";

const styles = nano.sheet({
  root: {
    "&::-webkit-slider-thumb": {
      appearance: "none",
      height: "15px",
      width: "3px",
      background: "white",
      position: "relative",
      top: "-6px",
    },
    "&::-webkit-slider-runnable-track": {
      padding: "0",
      height: "3px",
      margin: "0",
    },
    appearance: "none",
    cursor: "pointer",
    margin: "0",
    position: "relative",
    top: "-4px",
  },
});

export const Slider = React.forwardRef<
  HTMLInputElement,
  React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >
>((props, ref) => (
  <input
    {...props}
    type="range"
    ref={ref}
    className={clsx(styles.root, props?.className)}
  />
));
Slider.displayName = "Slider";
