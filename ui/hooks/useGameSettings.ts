import { useLocalStorage } from "./useLocalStorage";

export interface GameSettings {
  pauseOnMissionOffer: boolean;
  scale: number;
  dev: boolean;
}

const defaultGameSttings: GameSettings = {
  pauseOnMissionOffer: true,
  scale: 1,
  dev: false,
};

export const useGameSettings = () =>
  useLocalStorage("gameSettings", defaultGameSttings);
