import clsx from "clsx";
import React from "react";
import { IconButton } from "@kit/IconButton";
import { CloseIcon, ExclamationIcon, QuestionIcon } from "@assets/ui/icons";
import { BaseButton } from "@kit/BaseButton";
import styles from "./styles.scss";
import type { NotificationProps } from "./types";

export const Notification: React.FC<NotificationProps> = ({
  icon,
  message,
  type,
  onClick,
  dismiss,
}) => (
  <BaseButton
    className={clsx(styles.notification, {
      [styles.notificationSuccess]: type === "success",
      [styles.notificationWarning]: type === "warning",
      [styles.notificationError]: type === "error",
    })}
    onClick={onClick}
  >
    {icon === "exclamation" ? (
      <ExclamationIcon className={styles.notificationIcon} />
    ) : (
      <QuestionIcon className={styles.notificationIcon} />
    )}
    <p className={styles.notificationMessage}>{message}</p>
    {dismiss && (
      <IconButton
        className={styles.notificationDismiss}
        onClick={(event) => {
          event.stopPropagation();
          dismiss();
        }}
        variant="naked"
      >
        <CloseIcon />
      </IconButton>
    )}
  </BaseButton>
);
