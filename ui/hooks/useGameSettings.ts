import { useLocalStorage } from "./useLocalStorage";

export interface GameSettings {
  pauseOnMissionOffer: boolean;
  scale: number;
}

const defaultGameSttings: GameSettings = {
  pauseOnMissionOffer: true,
  scale: 1,
};

export const useGameSettings = () =>
  useLocalStorage("gameSettings", defaultGameSttings);
