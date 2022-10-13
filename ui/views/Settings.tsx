import React from "react";
import { Button } from "@kit/Button";
import { nano } from "../style";
import useFullscreen from "../hooks/useFullscreen";
import { View } from "../components/View";

const styles = nano.sheet({
  button: {
    "&:not(:last-child)": {
      marginBottom: "var(--spacing-1)",
    },
    width: "100%",
  },
});

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
