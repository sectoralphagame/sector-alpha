import clsx from "clsx";
import React from "react";
import styles from "./IconButton.scss";
import type { BaseButtonProps } from "./BaseButton";
import { BaseButton } from "./BaseButton";

interface IconButtonProps extends BaseButtonProps {
  variant?: "outlined" | "naked" | "opaque";
}

export const IconButton: React.FC<IconButtonProps> = ({
  variant = "outlined",
  ...props
}) => (
  <BaseButton
    type="button"
    {...props}
    // eslint-disable-next-line react/destructuring-assignment
    className={clsx(styles.root, props?.className, {
      [styles.outlined]: variant === "outlined",
      [styles.naked]: variant === "naked",
      [styles.opaque]: variant === "opaque",
    })}
  />
);
IconButton.displayName = "IconButton";
