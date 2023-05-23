import { useNotifications } from "@ui/atoms";
import React from "react";
import { Notification } from "./Notification";
import { NotificationContainer } from "./NotificationContainer";

export const Notifications: React.FC = () => {
  const { notifications, addNotification, removeNotification } =
    useNotifications();
  if (!window.notify) {
    window.notify = addNotification;
  }

  return (
    <NotificationContainer>
      {notifications.map(({ id, onClick, dismissable, ...props }) => (
        <Notification
          key={id}
          onClick={() => {
            onClick();
            removeNotification(id);
          }}
          {...(dismissable ? { dismiss: () => removeNotification(id) } : {})}
          {...props}
        />
      ))}
    </NotificationContainer>
  );
};
