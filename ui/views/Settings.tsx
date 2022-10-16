import React from "react";
import { Button } from "@kit/Button";
import styles from "./Settings.scss";
import useFullscreen from "../hooks/useFullscreen";
import { View } from "../components/View";

export const Settings: React.FC = () => {
  const { fullscreenEnabled, toggle } = useFullscreen();

  return (
    <View title="Settings">
      <Button className={styles.button} onClick={toggle}>
        {fullscreenEnabled ? "Disable Fullscreen" : "Enable Fullscreen"}
      </Button>
    </View>
  );
};
Settings.displayName = "Settings";
