import type { DevAction } from "@core/actions/types";
import React from "react";
import { actionLoader } from "@core/actionLoader";
import { useGameStore } from "@ui/state/game";
import { useOverlayRegister } from "../Overlay/Overlay";
import { DevOverlayComponent } from "./DevOverlayComponent";

const DevOverlay: React.FC = () => {
  const [actions, setActions] = React.useState<DevAction[]>(actionLoader.all());
  const [[overlay, selectedUnit], gameStore] = useGameStore((store) => [
    store.overlay,
    store.selectedUnit,
  ]);
  useOverlayRegister("dev");

  if (overlay !== "dev") {
    return null;
  }

  return (
    <DevOverlayComponent
      actions={actions}
      target={selectedUnit?.id ?? null}
      onReload={() => setActions(actionLoader.all())}
      onClose={gameStore.closeOverlay}
    />
  );
};

export default DevOverlay;
