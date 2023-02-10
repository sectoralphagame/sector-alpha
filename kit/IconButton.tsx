import clsx from "clsx";
import React from "react";
import styles from "./IconButton.scss";

interface IconButtonProps
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  variant?: "outlined" | "naked";
}

export const IconButton: React.FC<IconButtonProps> = ({
  variant = "outlined",
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
      // eslint-disable-next-line react/destructuring-assignment
      className={clsx(styles.root, props?.className, {
        [styles.outlined]: variant === "outlined",
        [styles.naked]: variant === "naked",
      })}
    />
  );
};
IconButton.displayName = "IconButton";
