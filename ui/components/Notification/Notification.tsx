import clsx from "clsx";
import React from "react";
import questionIcon from "@assets/ui/question.svg";
import exclamationIcon from "@assets/ui/exclamation.svg";
import SVG from "react-inlinesvg";
import styles from "./styles.scss";

export interface NotificationProps {
  message: string;
  type: "success" | "warning" | "error";
  icon: "question" | "exclamation";
}

export const Notification: React.FC<NotificationProps> = ({
  icon,
  message,
  type,
}) => (
  <div
    className={clsx(styles.notification, {
      [styles.notificationSuccess]: type === "success",
      [styles.notificationWarning]: type === "warning",
      [styles.notificationError]: type === "error",
    })}
  >
    <SVG
      src={icon === "exclamation" ? exclamationIcon : questionIcon}
      className={styles.notificationIcon}
    />
    <p className={styles.notificationMessage}>{message}</p>
  </div>
);
