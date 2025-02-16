import { useLocalStorage } from "./useLocalStorage";

export interface GameSettings {
  pauseOnMissionOffer: boolean;
  scale: number;
  dev: boolean;
  volume: Record<"ui", number>;
  graphics: {
    postProcessing: boolean;
    fxaa: boolean;
  };
  camera: {
    pan: number;
    zoom: number;
  };
}

const defaultGameSttings: GameSettings = {
  pauseOnMissionOffer: true,
  scale: 10,
  dev: false,
  volume: {
    ui: 1,
  },
  graphics: {
    postProcessing: false,
    fxaa: false,
  },
  camera: {
    pan: 1,
    zoom: 1,
  },
};

export const useGameSettings = () =>
  useLocalStorage("gameSettings", defaultGameSttings);
