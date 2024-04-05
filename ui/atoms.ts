import { atom, useRecoilState } from "recoil";
import type { Sim } from "@core/sim";
import { Observable } from "@core/utils/observer";
import type { ConfigDialogProps } from "./components/ConfigDialog";
import type { ContextMenu } from "./components/ContextMenu/types";
import type { TradeDialogProps } from "./components/TradeDialog";
import type { FacilityModuleManagerProps } from "./components/FacilityModuleManager";
import type { FacilityMoneyManagerProps } from "./components/FacilityMoneyManager";
import type { FacilityTradeManagerProps } from "./components/FacilityTradeManager";
import type { ShipyardDialogProps } from "./components/ShipyardDialog";
import type { MissionDialogProps } from "./components/MissionDialog";
import type { NotificationProps } from "./components/Notifications";
import type { Notification } from "./components/Notifications/types";
import { useObservable } from "./hooks/useObservable";

export const sim = atom<Sim>({
  key: "sim",
  default: window.sim as Sim,
  dangerouslyAllowMutability: true,
});
export const useSim = () => useRecoilState(sim);

export const contextMenu = atom<ContextMenu>({
  key: "contextMenu",
  default: {
    active: false,
    position: [0, 0],
    worldPosition: [0, 0],
    sector: null,
  },
  dangerouslyAllowMutability: true,
});
export const useContextMenu = () => useRecoilState(contextMenu);
export type ContextMenuApi = ReturnType<typeof useRecoilState<ContextMenu>>;

export type GameDialogProps =
  | TradeDialogProps
  | ConfigDialogProps
  | FacilityModuleManagerProps
  | FacilityMoneyManagerProps
  | FacilityTradeManagerProps
  | ShipyardDialogProps
  | MissionDialogProps
  | null;

const gameDialog = new Observable<GameDialogProps>("gameDialog");
export const useGameDialog = () => useObservable(gameDialog);

export type GameOverlayProps = "fleet" | "missions" | "dev" | null;

export const gameOverlay = atom<GameOverlayProps>({
  key: "gameOverlay",
  default: null,
});
export const useGameOverlay = () => useRecoilState(gameOverlay);

export const notificationsAtom = atom<Notification[]>({
  key: "notiifications",
  default: [],
});
export const useNotifications = () => {
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
    if (notification.expires) {
      setTimeout(() => removeNotification(id), notification.expires);
    }
  };

  return { notifications, addNotification, removeNotification };
};
