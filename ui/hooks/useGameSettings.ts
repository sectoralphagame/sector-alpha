import { useLocalStorage } from "./useLocalStorage";

export interface GameSettings {
  pauseOnMissionOffer: boolean;
}

const defaultGameSttings: GameSettings = {
  pauseOnMissionOffer: true,
};

export const useGameSettings = () =>
  useLocalStorage("gameSettings", defaultGameSttings);
