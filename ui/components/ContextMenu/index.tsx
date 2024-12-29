import React from "react";
import { shipComponents } from "@core/archetypes/ship";
import { defaultClickSound } from "@kit/BaseButton";
import { useGameStore } from "@ui/state/game";
import { useContextMenuStore } from "@ui/state/contextMenu";
import { ShipToSpace } from "./ShipToSpace";
import { NoAvailableActions } from "./NoAvailableActions";
import { ShipToEntity } from "./ShipToEntity";

export const ContextMenu: React.FC = () => {
  const [[menu]] = useContextMenuStore((store) => [store.state]);
  const [[selectedUnit]] = useGameStore((store) => [store.selectedUnit]);

  console.log("i rerendered");

  React.useEffect(() => {
    if (menu.active) {
      defaultClickSound.play();
    }
  }, [menu.active]);

  if (!menu.active) return null;

  if (menu.target) {
    return <ShipToEntity />;
  }

  if (selectedUnit?.hasComponents(shipComponents)) {
    return <ShipToSpace />;
  }

  return <NoAvailableActions />;
};

ContextMenu.displayName = "ContextMenu";
