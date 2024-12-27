import React from "react";
import { shipComponents } from "@core/archetypes/ship";
import { getSelectedSecondary } from "@core/components/selection";
import { defaultClickSound } from "@kit/BaseButton";
import { useContextMenu } from "@ui/state/contextMenu";
import { useGameStore } from "@ui/state/game";
import { useSim } from "../../atoms";
import { ShipToSpace } from "./ShipToSpace";
import { NoAvailableActions } from "./NoAvailableActions";
import { ShipToEntity } from "./ShipToEntity";

export const ContextMenu: React.FC = () => {
  const [sim] = useSim();
  const [menu] = useContextMenu();

  const [[selectedUnit]] = useGameStore((store) => [store.selectedUnit]);
  const actionable = getSelectedSecondary(sim);

  React.useEffect(() => {
    if (menu.active) {
      defaultClickSound.play();
    }
  }, [menu.active]);

  if (actionable) {
    return <ShipToEntity />;
  }

  if (selectedUnit?.hasComponents(shipComponents)) {
    return <ShipToSpace />;
  }

  return <NoAvailableActions />;
};

ContextMenu.displayName = "ContextMenu";
