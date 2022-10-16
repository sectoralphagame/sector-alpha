import clsx from "clsx";
import React from "react";
import styles from "./Button.scss";

export interface ButtonProps
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  active?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  active,
  className,
  ...props
}) => {
  const ref = React.useRef<HTMLButtonElement>(null);

  return (
    <button
      type="button"
      {...props}
      ref={ref}
      onMouseUp={() => {
        ref.current?.blur();
      }}
      className={clsx(styles.root, className, {
        [styles.active]: active,
      })}
    />
  );
};
Button.displayName = "Button";
