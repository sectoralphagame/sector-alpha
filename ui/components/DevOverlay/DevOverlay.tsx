import type { DevAction } from "@core/actions/types";
import { useGameOverlay, useSim } from "@ui/atoms";
import React from "react";
import { DevOverlayComponent } from "./DevOverlayComponent";

const DevOverlay: React.FC = () => {
  const [sim] = useSim();
  const [actions, setActions] = React.useState<DevAction[]>(sim.actions.all());
  const [overlay, setOverlay] = useGameOverlay();

  if (overlay !== "dev") {
    return null;
  }

  return (
    <DevOverlayComponent
      actions={actions}
      target={sim.queries.settings.get()[0].cp.selectionManager.id}
      onReload={() => setActions(sim.actions.all())}
      onClose={() => setOverlay(null)}
    />
  );
};

export default DevOverlay;
