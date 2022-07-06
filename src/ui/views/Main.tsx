import React from "react";
import { Sim } from "../../sim";
import { nano, theme } from "../../style";
import { Button } from "../components/Button";
import { useLocation } from "../context/Location";
import world from "../../world";

export interface MainProps {
  sim: Sim;
}

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

export const Main: React.FC<MainProps> = () => {
  const navigate = useLocation();

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <Button
          className={styles.button}
          onClick={() => {
            const sim = new Sim();
            sim.init();

            window.sim = sim;
            world(sim);
            sim.start();
            navigate("game");
          }}
        >
          New Game
        </Button>
        <Button className={styles.button} onClick={() => navigate("load")}>
          Load Game
        </Button>
        <Button className={styles.button}>Settings</Button>
      </div>
    </div>
  );
};
