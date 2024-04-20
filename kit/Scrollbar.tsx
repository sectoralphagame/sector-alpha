import clsx from "clsx";
import React from "react";
import type { Props } from "simplebar-react";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import styles from "./Scrollbar.scss";

export const Scrollbar = React.forwardRef<any, Props>(
  ({ className, ...props }, ref) => (
    <SimpleBar
      className={clsx(styles.root, className)}
      autoHide={false}
      forceVisible="y"
      ref={ref}
      {...props}
    />
  )
);
