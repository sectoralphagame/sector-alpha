import React from "react";
import { Button } from "@kit/Button";
import { useGameSettings } from "@ui/hooks/useGameSettings";
import { Select, SelectButton, SelectOption, SelectOptions } from "@kit/Select";
import styles from "./Settings.scss";
import useFullscreen from "../hooks/useFullscreen";
import { View } from "../components/View";

export const Settings: React.FC = () => {
  const { fullscreenEnabled, toggle } = useFullscreen();
  const [settings, setSettings] = useGameSettings();

  return (
    <div>
      <Button className={styles.button} onClick={toggle}>
        {fullscreenEnabled ? "Disable Fullscreen" : "Enable Fullscreen"}
      </Button>
      <div className={styles.settingsRow}>
        <div>Pause on mission offer</div>
        <Select
          onChange={(value) =>
            setSettings((prevSettings) => ({
              ...prevSettings,
              pauseOnMissionOffer: value === "true",
            }))
          }
          value={settings.pauseOnMissionOffer.toString()}
        >
          <SelectButton>
            {settings.pauseOnMissionOffer ? "Enabled" : "Disabled"}
          </SelectButton>
          <SelectOptions>
            <SelectOption value="true">Enabled</SelectOption>
            <SelectOption value="false">Disabled</SelectOption>
          </SelectOptions>
        </Select>
      </div>
    </div>
  );
};
Settings.displayName = "Settings";

export const SettingsView: React.FC = () => (
  <View title="Settings">
    <Settings />
  </View>
);
SettingsView.displayName = "SettingsView";
