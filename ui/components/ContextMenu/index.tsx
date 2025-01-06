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
  const [[selectedUnits]] = useGameStore((store) => [store.selectedUnits]);

  React.useEffect(() => {
    if (menu.active) {
      defaultClickSound.play();
    }
  }, [menu.active]);

  if (!menu.active) return null;

  if (menu.target) {
    return <ShipToEntity />;
  }

  if (selectedUnits.every((unit) => unit.hasComponents(shipComponents))) {
    return <ShipToSpace />;
  }

  return <NoAvailableActions />;
};

ContextMenu.displayName = "ContextMenu";
