import React from "react";
import SVG from "react-inlinesvg";
import { Sim } from "@core/sim";
import type { Save } from "@core/db";
import arrowLeftIcon from "@assets/ui/arrow_left.svg";
import { Dialog } from "@kit/Dialog";
import { Button } from "@kit/Button";
import { Input } from "@kit/Input";
import { IconButton } from "@kit/IconButton";
import { createBaseConfig } from "@core/sim/baseConfig";
import { Settings } from "@ui/views/Settings";
import LZString from "lz-string";
import { regen } from "@core/systems/pathPlanning";
import { useLocation } from "../context/Location";
import styles from "./ConfigDialog.scss";
import { Saves } from "./Saves";
import { useSim } from "../atoms";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
}

const views = ["default", "load", "save", "settings"] as const;
type Views = (typeof views)[number];

export interface ConfigDialogProps {
  type: "config";
}

export const ConfigDialog: React.FC<ModalProps> = ({ open, onClose }) => {
  const [view, setView] = React.useState<Views>("default");
  const [saves, setSaves] = React.useState<Save[]>();
  const input = React.useRef<HTMLInputElement>(null);
  const navigate = useLocation();
  const [sim, setSim] = useSim();

  React.useEffect(() => {
    if (["load", "save"].includes(view)) {
      Sim.listSaves().then(setSaves);
    }
  }, [view]);

  React.useEffect(() => {
    setView("default");
  }, [open]);

  const saveNew: React.FormEventHandler = React.useCallback(
    (event) => {
      event.preventDefault();
      if (input.current!.value) {
        sim.save(input.current!.value);
        onClose();
      }
    },
    [sim]
  );

  return (
    <Dialog open={open} onClose={onClose} title="Configuration" width="500px">
      {view !== "default" && (
        <IconButton
          className={styles.backButton}
          onClick={() => setView("default")}
        >
          <SVG src={arrowLeftIcon} />
        </IconButton>
      )}
      {view === "default" ? (
        <div>
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
              setSim(null);
              sim.destroy();
              const newSim = Sim.load(
                createBaseConfig(),
                LZString.decompress(saves.find((s) => s.id === id)!.data)
              );
              setTimeout(() => {
                setSim(newSim);
                regen(newSim);
                onClose();
              }, 100);
            }}
            onDelete={async (id) => {
              await Sim.deleteSave(id);
              Sim.listSaves().then(setSaves);
            }}
          />
        )
      ) : view === "save" ? (
        <div>
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
        <Settings />
      )}
    </Dialog>
  );
};
ConfigDialog.displayName = "ConfigDialog";
