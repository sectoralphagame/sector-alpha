import { useGameOverlay, useSim } from "@ui/atoms";
import React from "react";
import { MissionsOverlayComponent } from "./MissionsOverlayComponent";

export const MissionsOverlay: React.FC = () => {
  const [sim] = useSim();
  const [overlay] = useGameOverlay();

  if (overlay !== "missions") return null;

  const player = sim.queries.player.get()[0]!;

  return (
    <MissionsOverlayComponent
      missions={player.cp.missions.value}
      onMissionCancel={(index) => player.cp.missions.value.splice(index, 1)}
    />
  );
};
