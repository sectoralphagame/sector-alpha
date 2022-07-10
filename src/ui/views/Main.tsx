import React from "react";
import { nano, theme } from "../../style";
import { Button } from "../components/Button";
import { useLocation } from "../context/Location";

const styles = nano.sheet({
  container: {
    padding: theme.spacing(4),
    width: "420px",
  },
  button: {
    "&:not(:last-child)": {
      marginBottom: theme.spacing(1),
    },
    width: "100%",
  },
  root: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    height: "100%",
  },
});

export const Main: React.FC = () => {
  const navigate = useLocation();

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <Button className={styles.button} onClick={() => navigate("new")}>
          New Game
        </Button>
        <Button className={styles.button} onClick={() => navigate("load")}>
          Load Game
        </Button>
        <Button className={styles.button} onClick={() => navigate("settings")}>
          Settings
        </Button>
      </div>
    </div>
  );
};
