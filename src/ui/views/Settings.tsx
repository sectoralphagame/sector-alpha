import React from "react";
import { nano, theme } from "../../style";
import { Button } from "../components/Button";
import useFullscreen from "../hooks/useFullscreen";
import { View } from "../components/View";

const styles = nano.sheet({
  button: {
    "&:not(:last-child)": {
      marginBottom: theme.spacing(1),
    },
    width: "100%",
  },
});

export const Settings: React.FC = () => {
  const { fullscreenEnabled, toggle } = useFullscreen();

  return (
    <View>
      <Button className={styles.button} onClick={toggle}>
        {fullscreenEnabled ? "Disable Fullscreen" : "Enable Fullscreen"}
      </Button>
    </View>
  );
};
Settings.displayName = "Settings";
