import clsx from "clsx";
import React from "react";
import styles from "./Checkbox.scss";
import { defaultClickSound, popSound } from "./BaseButton";

export const Checkbox: React.FC<
  React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >
> = ({ onClick, onMouseEnter, ...props }) => {
  const ref = React.useRef<HTMLInputElement>(null);

  return (
    <input
      type="checkbox"
      {...props}
      ref={ref}
      onClick={(event) => {
        defaultClickSound.play();
        if (onClick) {
          onClick(event);
        }
      }}
      onMouseEnter={(event) => {
        popSound.play();
        if (onMouseEnter) {
          onMouseEnter(event);
        }
      }}
      onMouseUp={() => {
        ref.current?.blur();
      }}
      // eslint-disable-next-line react/destructuring-assignment
      className={clsx(styles.root, props?.className)}
    />
  );
};
Checkbox.displayName = "Checkbox";
