import React from "react";
import { shipComponents } from "@core/archetypes/ship";
import { getSelected, getSelectedSecondary } from "@core/components/selection";
import { defaultClickSound } from "@kit/BaseButton";
import { useContextMenu, useSim } from "../../atoms";
import { ShipToSpace } from "./ShipToSpace";
import { NoAvailableActions } from "./NoAvailableActions";
import { ShipToEntity } from "./ShipToEntity";

export const ContextMenu: React.FC = () => {
  const [sim] = useSim();
  const [menu] = useContextMenu();

  const selectedEntity = getSelected(sim);
  const actionable = getSelectedSecondary(sim);

  React.useEffect(() => {
    if (menu.active) {
      defaultClickSound.play();
    }
  }, [menu.active]);

  if (actionable) {
    return <ShipToEntity />;
  }

  if (selectedEntity?.hasComponents(shipComponents)) {
    return <ShipToSpace />;
  }

  return <NoAvailableActions />;
};

ContextMenu.displayName = "ContextMenu";
