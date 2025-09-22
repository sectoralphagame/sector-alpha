import clsx from "clsx";
import React from "react";
import styles from "./IconButton.scss";
import type { BaseButtonProps } from "./BaseButton";
import { BaseButton } from "./BaseButton";

interface IconButtonProps extends BaseButtonProps {
  variant?: "outlined" | "naked" | "opaque";
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = "outlined", ...props }, ref) => (
    <BaseButton
      type="button"
      ref={ref}
      {...props}
      // eslint-disable-next-line react/destructuring-assignment
      className={clsx(styles.root, props?.className, {
        [styles.outlined]: variant === "outlined",
        [styles.naked]: variant === "naked",
        [styles.opaque]: variant === "opaque",
      })}
    />
  )
);
IconButton.displayName = "IconButton";
