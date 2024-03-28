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
      onAccept={() => {
        const player = sim.queries.player.get()[0]!;
        player.cp.missions.value.push({
          ...player.cp.missions.offer!.data,
          accepted: sim.getTime(),
        });
      }}
      onDecline={() => {
        sim.queries.player.get()[0]!.cp.missions.declined = sim.getTime();
      }}
      onClose={() => {
        onClose();
        sim.queries.player.get()[0]!.cp.missions.offer = null;
        if (settings.pauseOnMissionOffer) {
          sim.unpause();
        }
      }}
    />
  );
};
MissionDialog.displayName = "MissionDialog";
