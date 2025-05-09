import React from "react";
import { Button } from "@kit/Button";
import { useGameSettings } from "@ui/hooks/useGameSettings";
import { Select, SelectButton, SelectOption, SelectOptions } from "@kit/Select";
import { Slider } from "@kit/Slider";
import { Howler } from "howler";
import merge from "lodash/merge";
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
      <div className={styles.settingsRow}>
        <div>UI scale</div>
        <Slider
          value={settings.scale}
          onChange={(event) =>
            setSettings((prevSettings) => ({
              ...prevSettings,
              scale: Number(event.target.value),
            }))
          }
          max={14}
          min={6}
          step={0.5}
        />
      </div>
      <hr />
      <div className={styles.settingsRow}>
        <div>UI Volume</div>
        <Slider
          value={settings.volume.ui}
          onChange={(event) => {
            const volume = Number(event.target.value);

            setSettings((prevSettings) => ({
              ...prevSettings,
              volume: {
                ...prevSettings.volume,
                ui: volume,
              },
            }));

            Howler.volume(volume);
          }}
          max={1}
          min={0}
          step={0.01}
        />
      </div>
      <hr />
      <div className={styles.settingsRow}>
        <div>Antialiasing</div>
        <Select
          onChange={(value) =>
            setSettings((prevSettings) =>
              merge({}, prevSettings, {
                graphics: {
                  fxaa: value === "true",
                },
              })
            )
          }
          value={(settings.graphics?.fxaa ?? false).toString()}
        >
          <SelectButton>
            {settings.graphics?.fxaa ? "Enabled" : "Disabled"}
          </SelectButton>
          <SelectOptions>
            <SelectOption value="true">FXAA</SelectOption>
            <SelectOption value="false">Disabled</SelectOption>
          </SelectOptions>
        </Select>
      </div>
      <div className={styles.settingsRow}>
        <div>Volumetric Light Scattering</div>
        <Select
          // FIXME: Godrays need refinement
          disabled
          onChange={(value) =>
            setSettings((prevSettings) =>
              merge({}, prevSettings, {
                graphics: {
                  godrays: value === "true",
                },
              })
            )
          }
          // value={(settings.graphics?.godrays ?? false).toString()}
          value="false"
        >
          <SelectButton>
            {settings.graphics?.godrays ? "Enabled" : "Disabled"}
          </SelectButton>
          <SelectOptions>
            <SelectOption value="true">Enabled</SelectOption>
            <SelectOption value="false">Disabled</SelectOption>
          </SelectOptions>
        </Select>
      </div>
      <hr />
      <div className={styles.settingsRow}>
        <div>Developer tools</div>
        <Select
          onChange={(value) =>
            setSettings((prevSettings) => ({
              ...prevSettings,
              dev: value === "true",
            }))
          }
          value={(settings.dev ?? false).toString()}
        >
          <SelectButton>{settings.dev ? "Enabled" : "Disabled"}</SelectButton>
          <SelectOptions>
            <SelectOption value="true">Enabled</SelectOption>
            <SelectOption value="false">Disabled</SelectOption>
          </SelectOptions>
        </Select>
      </div>
      <hr />
      <div className={styles.settingsRow}>
        <div>Camera Pan Speed</div>
        <Slider
          value={settings.camera?.pan ?? 1}
          onChange={(event) => {
            const pan = Number(event.target.value);

            setSettings((prevSettings) => ({
              ...prevSettings,
              camera: {
                ...prevSettings.camera,
                pan,
              },
            }));
          }}
          max={4}
          min={0.25}
          step={0.01}
        />
      </div>
      <div className={styles.settingsRow}>
        <div>Camera Zoom Speed</div>
        <Slider
          value={settings.camera?.zoom ?? 1}
          onChange={(event) => {
            const zoom = Number(event.target.value);

            setSettings((prevSettings) => ({
              ...prevSettings,
              camera: {
                ...prevSettings.camera,
                zoom,
              },
            }));
          }}
          max={4}
          min={0.25}
          step={0.01}
        />
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
