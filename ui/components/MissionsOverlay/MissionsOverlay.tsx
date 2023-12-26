import { useGameOverlay, useSim } from "@ui/atoms";
import React from "react";
import { MissionsOverlayComponent } from "./MissionsOverlayComponent";

export const MissionsOverlay: React.FC = () => {
  const [sim] = useSim();
  const [overlay, setOverlay] = useGameOverlay();

  if (overlay !== "missions") return null;

  const player = sim.queries.player.get()[0]!;

  return (
    <MissionsOverlayComponent
      missions={player.cp.missions.value}
      onMissionCancel={(index) => player.cp.missions.value.splice(index, 1)}
      onReferenceClick={(id) => {
        setOverlay(null);
        const settingsManager = sim.queries.settings.get()[0];
        settingsManager.cp.selectionManager.id = id;
        setTimeout(() => {
          settingsManager.cp.selectionManager.focused = true;
        }, 100);
      }}
    />
  );
};
