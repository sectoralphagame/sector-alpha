import { atom, useRecoilState } from "recoil";
import type { Sim } from "@core/sim";
import type { ConfigDialogProps } from "./components/ConfigDialog";
import type { ContextMenu } from "./components/ContextMenu/types";
import type { TradeDialogProps } from "./components/TradeDialog";
import type { FacilityModuleManagerProps } from "./components/FacilityModuleManager";
import type { FacilityMoneyManagerProps } from "./components/FacilityMoneyManager ";

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

export type GameDialogProps =
  | TradeDialogProps
  | ConfigDialogProps
  | FacilityModuleManagerProps
  | FacilityMoneyManagerProps
  | null;

export const gameDialog = atom<GameDialogProps>({
  key: "gameDialog",
  default: null,
});
export const useGameDialog = () => useRecoilState(gameDialog);
