import { atom, useRecoilState } from "recoil";
import type { Sim } from "@core/sim";
import { Observable } from "@core/utils/observer";
import notificationSound from "@assets/ui/sounds/notification.wav";
import { Howl } from "howler";
import type { ConfigDialogProps } from "./components/ConfigDialog";
import type { TradeDialogProps } from "./components/TradeDialog";
import type { FacilityModuleManagerProps } from "./components/FacilityModuleManager";
import type { FacilityMoneyManagerProps } from "./components/FacilityMoneyManager";
import type { FacilityTradeManagerProps } from "./components/FacilityTradeManager";
import type { ShipyardDialogProps } from "./components/ShipyardDialog";
import type { MissionDialogProps } from "./components/MissionDialog";
import type { NotificationProps } from "./components/Notifications";
import type { Notification } from "./components/Notifications/types";
import { useObservable } from "./hooks/useObservable";
import type { ImmediateConversationDialogProps } from "./components/ImmediateConversation";
import { useGameSettings } from "./hooks/useGameSettings";

export const sim = atom<Sim>({
  key: "sim",
  default: window.sim as Sim,
  dangerouslyAllowMutability: true,
});
export const useSim = () => useRecoilState(sim);

export type GameDialogProps =
  | TradeDialogProps
  | ConfigDialogProps
  | FacilityModuleManagerProps
  | FacilityMoneyManagerProps
  | FacilityTradeManagerProps
  | ShipyardDialogProps
  | MissionDialogProps
  | ImmediateConversationDialogProps
  | null;

export const gameDialog = new Observable<GameDialogProps>("gameDialog");
export const useGameDialog = () => useObservable(gameDialog);

export type GameOverlayProps = "fleet" | "missions" | "dev" | null;

export const gameOverlay = atom<GameOverlayProps>({
  key: "gameOverlay",
  default: null,
});
export const useGameOverlay = () => useRecoilState(gameOverlay);

const notificationHowl = new Howl({
  src: notificationSound,
});
export const notificationsAtom = atom<Notification[]>({
  key: "notiifications",
  default: [],
});
export const useNotifications = () => {
  const [settings] = useGameSettings();
  const [notifications, setNotifications] = useRecoilState(notificationsAtom);

  const removeNotification = (id: number) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const addNotification = (
    notification: Omit<NotificationProps, "dismiss"> & {
      expires?: number;
      dismissable?: boolean;
    }
  ) => {
    const id = Date.now();
    setNotifications((prevNotifications) => [
      ...prevNotifications,
      { ...notification, id },
    ]);
    notificationHowl.volume(settings.volume.ui);
    notificationHowl.play();
    if (notification.expires) {
      setTimeout(() => removeNotification(id), notification.expires);
    }
  };

  return { notifications, addNotification, removeNotification };
};
