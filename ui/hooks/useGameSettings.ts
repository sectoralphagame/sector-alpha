import { defaultGameSttings } from "@core/settings";
import { useMemo } from "react";
import merge from "lodash/merge";
import { useLocalStorage } from "./useLocalStorage";

export function useGameSettings() {
  const [settingsFromStorage, setSettings] = useLocalStorage(
    "gameSettings",
    defaultGameSttings
  );
  const settings = useMemo(
    () => merge({}, defaultGameSttings, settingsFromStorage),
    [settingsFromStorage]
  );

  return [settings, setSettings] as const;
}
