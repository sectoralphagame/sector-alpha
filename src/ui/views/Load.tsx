import React from "react";
import SVG from "react-inlinesvg";
import { nano, theme } from "../../style";
import { Sim } from "../../sim";
import { Save } from "../../db";
import { useLocation } from "../context/Location";
import { IconButton } from "../components/IconButton";
import arrowLeftIcon from "../../../assets/ui/arrow_left.svg";
import { Saves } from "../components/Saves";

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
  input: {
    marginBottom: theme.spacing(1),
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

export const LoadGame: React.FC = () => {
  const navigate = useLocation();
  const [saves, setSaves] = React.useState<Save[]>();

  React.useEffect(() => {
    Sim.listSaves().then(setSaves);
  }, []);

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
          {!!saves && (
            <Saves
              saves={saves}
              onClick={async (id) => {
                window.sim = await Sim.load(
                  saves.find((s) => s.id === id)!.data
                );
                window.sim.start();
                navigate("game");
              }}
              onDelete={async (id) => {
                await Sim.deleteSave(id);
                Sim.listSaves().then(setSaves);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
LoadGame.displayName = "LoadGame";
