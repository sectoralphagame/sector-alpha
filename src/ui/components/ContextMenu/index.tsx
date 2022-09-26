import React from "react";
import { shipComponents } from "../../../archetypes/ship";
import { useSim } from "../../atoms";
import { ShipToSpace } from "./ShipToSpace";
import { NoAvailableActions } from "./NoAvailableActions";
import { Menu } from "../../views/Game";

export const ContextMenu: React.FC<{ menu: Menu }> = ({ menu }) => {
  const [sim] = useSim();
  const selectedEntity = sim.get(
    sim.queries.settings.get()[0].cp.selectionManager.id!
  );

  if (selectedEntity?.hasComponents(shipComponents)) {
    return <ShipToSpace menu={menu} />;
  }

  return <NoAvailableActions />;
};

ContextMenu.displayName = "ContextMenu";
