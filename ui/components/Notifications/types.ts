import type { NotificationProps } from "./Notification";

export interface Notification extends Omit<NotificationProps, "dismiss"> {
  id: number;
  dismissable?: boolean;
}
