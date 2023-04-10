import clsx from "clsx";
import React from "react";
import styles from "./Overlay.scss";

export interface OverlayProps {
  active: boolean;
}

export const Overlay: React.FC<OverlayProps> = ({ active }) => (
  <div
    className={clsx(styles.root, {
      [styles.active]: active,
    })}
  >
    dupa
  </div>
);
