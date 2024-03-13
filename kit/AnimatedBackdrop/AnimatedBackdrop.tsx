import clsx from "clsx";
import React from "react";
import styles from "./styles.scss";

export const AnimatedBackdrop: React.FC<React.HTMLProps<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={clsx(styles.root, className)} {...props}>
    <div className={styles.rootBackdrop}>
      <div className={styles.rootBackdropDot} />
      <div className={styles.rootBackdropDot} />
    </div>
    {children}
  </div>
);
