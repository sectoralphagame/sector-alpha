import clsx from "clsx";
import React from "react";
import styles from "./Slider.scss";

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
