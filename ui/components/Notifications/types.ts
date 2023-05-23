export interface NotificationProps {
  message: string;
  type: "success" | "warning" | "error";
  icon: "question" | "exclamation";
  onClick: () => void;
  dismiss?: () => void;
}

export interface Notification extends Omit<NotificationProps, "dismiss"> {
  id: number;
  dismissable?: boolean;
}
