import { defaultGameSttings } from "@core/settings";
import { useLocalStorage } from "./useLocalStorage";

export const useGameSettings = () =>
  useLocalStorage("gameSettings", defaultGameSttings);
