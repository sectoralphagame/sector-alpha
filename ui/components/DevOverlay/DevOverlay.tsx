import type { DevAction } from "@core/actions/types";
import { useSim } from "@ui/atoms";
import React from "react";
import { actionLoader } from "@core/actionLoader";
import { useGameStore } from "@ui/state/game";
import { useOverlayRegister } from "../Overlay/Overlay";
import { DevOverlayComponent } from "./DevOverlayComponent";

const DevOverlay: React.FC = () => {
  const [sim] = useSim();
  const [actions, setActions] = React.useState<DevAction[]>(actionLoader.all());
  const [overlay, gameStore] = useGameStore((store) => store.overlay);
  useOverlayRegister("dev");

  if (overlay !== "dev") {
    return null;
  }

  return (
    <DevOverlayComponent
      actions={actions}
      target={sim.index.settings.get()[0].cp.selectionManager.id}
      onReload={() => setActions(actionLoader.all())}
      onClose={gameStore.closeOverlay}
    />
  );
};

export default DevOverlay;
