import { useGameDialog, useSim } from "@ui/atoms";
import { useGameSettings } from "@ui/hooks/useGameSettings";
import React from "react";
import type { ModalProps } from "../ConfigDialog";
import { MissionDialogComponent } from "./MissionDialogComponent";

export interface MissionDialogProps {
  type: "missionOffer";
}

export const MissionDialog: React.FC<ModalProps> = ({ open, onClose }) => {
  const [sim] = useSim();
  const [dialog] = useGameDialog();
  const [settings] = useGameSettings();

  React.useEffect(() => {
    if (dialog?.type === "missionOffer" && settings.pauseOnMissionOffer) {
      sim.pause();
    }
  }, [dialog]);

  if (dialog?.type !== "missionOffer") return null;

  return (
    <MissionDialogComponent
      mission={sim.queries.player.get()[0]!.cp.missions.offer!}
      open={open}
      onClose={() => {
        onClose();
        sim.queries.player.get()[0]!.cp.missions.offer = null;
        if (settings.pauseOnMissionOffer) {
          sim.setSpeed(1);
        }
      }}
    />
  );
};
MissionDialog.displayName = "MissionDialog";
