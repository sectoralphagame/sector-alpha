import { useLocalStorage } from "./useLocalStorage";

export interface GameSettings {
  pauseOnMissionOffer: boolean;
  scale: number;
  dev: boolean;
  volume: Record<"ui", number>;
}

const defaultGameSttings: GameSettings = {
  pauseOnMissionOffer: true,
  scale: 10,
  dev: false,
  volume: {
    ui: 1,
  },
};

export const useGameSettings = () =>
  useLocalStorage("gameSettings", defaultGameSttings);
