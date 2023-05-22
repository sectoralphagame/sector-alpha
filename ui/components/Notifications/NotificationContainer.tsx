import React from "react";
import styles from "./styles.scss";

export const NotificationContainer: React.FC<React.PropsWithChildren> = ({
  children,
}) => <div className={styles.container}>{children}</div>;
