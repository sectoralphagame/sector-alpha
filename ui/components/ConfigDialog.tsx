import React from "react";
import SVG from "react-inlinesvg";
import { Sim } from "@core/sim";
import { Save } from "@core/db";
import arrowLeftIcon from "@assets/ui/arrow_left.svg";
import { Dialog } from "@kit/Dialog";
import { Button } from "@kit/Button";
import { Input } from "@kit/Input";
import { IconButton } from "@kit/IconButton";
import { useLocation } from "../context/Location";
import { nano } from "../style";
import { Saves } from "./Saves";
import useFullscreen from "../hooks/useFullscreen";
import { useSim } from "../atoms";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
}

const styles = nano.sheet({
  backButton: {
    marginBottom: "var(--spacing-1)",
  },
  buttons: {},
  buttonContainer: {
    "&:not(:last-child)": {
      marginBottom: "var(--spacing-1)",
    },
    width: "100%",
  },
  input: {
    marginBottom: "var(--spacing-1)",
    width: "100%",
  },
  saveContainer: {
    "& > button:first-child": {
      flex: 1,
    },
    display: "flex",
    alignItems: "center",
    gap: "var(--spacing-1)",
  },
});

const views = ["default", "load", "save", "settings"] as const;
type Views = typeof views[number];

export interface ConfigDialogProps {
  type: "config";
}

export const ConfigDialog: React.FC<ModalProps> = ({ open, onClose }) => {
  const [view, setView] = React.useState<Views>("default");
  const [saves, setSaves] = React.useState<Save[]>();
  const input = React.useRef<HTMLInputElement>(null);
  const navigate = useLocation();
  const { fullscreenEnabled, toggle: toggleFullscreen } = useFullscreen();
  const [sim, setSim] = useSim();

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
      sim.save(input.current!.value);
      onClose();
    }
  }, []);

  return (
    <Dialog open={open} onClose={onClose} title="Configuration">
      {view !== "default" && (
        <IconButton
          className={styles.backButton}
          onClick={() => setView("default")}
        >
          <SVG src={arrowLeftIcon} />
        </IconButton>
      )}
      {view === "default" ? (
        <div className={styles.buttons}>
          <Button
            onClick={() => setView("load")}
            className={styles.buttonContainer}
          >
            load
          </Button>
          <Button
            onClick={() => setView("save")}
            className={styles.buttonContainer}
          >
            save
          </Button>
          <Button
            onClick={() => setView("settings")}
            className={styles.buttonContainer}
          >
            settings
          </Button>
          <Button
            onClick={() => {
              sim.destroy();
              navigate("main");
            }}
            className={styles.buttonContainer}
          >
            quit to main menu
          </Button>
        </div>
      ) : view === "load" ? (
        saves && (
          <Saves
            saves={saves}
            onClick={async (id) => {
              sim.destroy();
              setSim(Sim.load(saves.find((s) => s.id === id)!.data));
              onClose();
            }}
            onDelete={async (id) => {
              await Sim.deleteSave(id);
              Sim.listSaves().then(setSaves);
            }}
          />
        )
      ) : view === "save" ? (
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
                className={styles.buttonContainer}
                key={save.id}
                onClick={() => {
                  sim.save(save.name, save.id);
                  onClose();
                }}
              >
                {save.name}
              </Button>
            ))}
        </div>
      ) : (
        <div className={styles.buttons}>
          <Button className={styles.buttonContainer} onClick={toggleFullscreen}>
            {fullscreenEnabled ? "Disable Fullscreen" : "Enable Fullscreen"}
          </Button>
        </div>
      )}
    </Dialog>
  );
};
ConfigDialog.displayName = "ConfigDialog";
