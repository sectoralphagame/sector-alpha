import React from "react";
import SVG from "react-inlinesvg";
import { nano, theme } from "../../style";
import { useLocation } from "../context/Location";
import { IconButton } from "../components/IconButton";
import arrowLeftIcon from "../../../assets/ui/arrow_left.svg";
import { Button } from "../components/Button";
import useFullscreen from "../hooks/useFullscreen";

const styles = nano.sheet({
  backButton: {
    marginBottom: theme.spacing(1),
  },
  buttons: {},
  button: {
    "&:not(:last-child)": {
      marginBottom: theme.spacing(1),
    },
    width: "100%",
  },
  container: {
    padding: theme.spacing(4),
    width: "420px",
  },
  root: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    height: "100%",
  },
});

export const Settings: React.FC = () => {
  const navigate = useLocation();
  const { fullscreenEnabled, toggle } = useFullscreen();

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <IconButton
          className={styles.backButton}
          onClick={() => navigate("main")}
        >
          <SVG src={arrowLeftIcon} />
        </IconButton>
        <div className={styles.buttons}>
          <Button className={styles.button} onClick={toggle}>
            {fullscreenEnabled ? "Disable Fullscreen" : "Enable Fullscreen"}
          </Button>
        </div>
      </div>
    </div>
  );
};
Settings.displayName = "Settings";
