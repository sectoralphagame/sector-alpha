import React from "react";
import { nano } from "../../style";
import { Dialog } from "./Dialog";
import { Button } from "./Button";
import { Sim } from "../../sim";
import { Save } from "../../db";
import { Input } from "./Input";
import { useLocation } from "../context/Location";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
}

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
});

const views = ["default", "load", "save"] as const;
type Views = typeof views[number];

export const ConfigDialog: React.FC<ModalProps> = ({ open, onClose }) => {
  const [view, setView] = React.useState<Views>("default");
  const [saves, setSaves] = React.useState<Save[]>();
  const input = React.useRef<HTMLInputElement>(null);
  const navigate = useLocation();

  React.useEffect(() => {
    if (["load", "save"].includes(view)) {
      Sim.listSaves().then(setSaves);
    }
  }, [view]);

  React.useEffect(() => {
    setView("default");
  }, [open]);

  const saveNew: React.FormEventHandler = React.useCallback((event) => {
    event.preventDefault();
    if (input.current!.value) {
      window.sim.save(input.current!.value);
      onClose();
    }
  }, []);

  return (
    <Dialog open={open} onClose={onClose} title="Configuration">
      {view === "default" ? (
        <div className={styles.buttons}>
          <Button onClick={() => setView("load")} className={styles.button}>
            load
          </Button>
          <Button onClick={() => setView("save")} className={styles.button}>
            save
          </Button>
          <Button
            onClick={() => {
              window.sim.destroy();
              window.sim = undefined!;
              navigate("main");
            }}
            className={styles.button}
          >
            quit to main menu
          </Button>
        </div>
      ) : view === "load" ? (
        <div className={styles.buttons}>
          {!!saves &&
            saves.map((save) => (
              <Button
                className={styles.button}
                key={save.id}
                onClick={async () => {
                  window.sim.destroy();
                  window.sim = await Sim.load(save.data);
                  window.sim.start();
                  onClose();
                }}
              >
                {save.name}
              </Button>
            ))}
        </div>
      ) : (
        <div className={styles.buttons}>
          <form onSubmit={saveNew}>
            <Input
              className={styles.input}
              ref={input}
              placeholder="New save..."
            />
            <input type="submit" hidden />
          </form>
          {!!saves &&
            saves.map((save) => (
              <Button
                className={styles.button}
                key={save.id}
                onClick={() => {
                  window.sim.save(save.name, save.id);
                  onClose();
                }}
              >
                {save.name}
              </Button>
            ))}
        </div>
      )}
    </Dialog>
  );
};
ConfigDialog.displayName = "ConfigDialog";
