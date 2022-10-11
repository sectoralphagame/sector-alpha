import { atom, useRecoilState } from "recoil";
import type { Sim } from "../sim";
import { ConfigDialogProps } from "./components/ConfigDialog";
import { ContextMenu } from "./components/ContextMenu/types";
import { TradeDialogProps } from "./components/TradeDialog";

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

export type GameDialogProps = TradeDialogProps | ConfigDialogProps | null;

export const gameDialog = atom<GameDialogProps>({
  key: "gameDialog",
  default: null,
});
export const useGameDialog = () => useRecoilState(gameDialog);
