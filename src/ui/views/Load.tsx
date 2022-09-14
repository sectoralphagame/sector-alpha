import React from "react";
import { nano, theme } from "../../style";
import { Sim } from "../../sim";
import { Save } from "../../db";
import { useLocation } from "../context/Location";
import { Saves } from "../components/Saves";
import { View } from "../components/View";

const styles = nano.sheet({
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
});

export const LoadGame: React.FC = () => {
  const navigate = useLocation();
  const [saves, setSaves] = React.useState<Save[]>();

  React.useEffect(() => {
    Sim.listSaves().then(setSaves);
  }, []);

  return (
    <View title="Load Game">
      <div className={styles.buttons}>
        {!!saves && (
          <Saves
            saves={saves}
            onClick={async (id) => {
              window.sim = Sim.load(saves.find((s) => s.id === id)!.data);
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
    </View>
  );
};
LoadGame.displayName = "LoadGame";
