import React from "react";
import { nano } from "../../style";
import { Sim } from "../../sim";
import { Save } from "../../db";
import { Button } from "../components/Button";
import { useLocation } from "../context/Location";

const styles = nano.sheet({
  buttons: {},
  button: {
    "&:not(:last-child)": {
      marginBottom: "8px",
    },
    width: "100%",
  },
  input: {
    marginBottom: "8px",
    width: "100%",
  },
  container: {
    padding: "32px",
    width: "420px",
  },
  root: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    height: "100%",
  },
});

export const LoadGame: React.FC = () => {
  const navigate = useLocation();
  const [saves, setSaves] = React.useState<Save[]>();

  React.useEffect(() => {
    Sim.listSaves().then(setSaves);
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <div className={styles.buttons}>
          {!!saves &&
            saves.map((save) => (
              <Button
                className={styles.button}
                key={save.id}
                onClick={async () => {
                  window.sim = await Sim.load(save.data);
                  window.sim.start();
                  navigate("game");
                }}
              >
                {save.name}
              </Button>
            ))}
        </div>
      </div>
    </div>
  );
};
LoadGame.displayName = "LoadGame";
