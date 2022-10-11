import React from "react";
import { shipComponents } from "../../../archetypes/ship";
import { useSim } from "../../atoms";
import { ShipToSpace } from "./ShipToSpace";
import { NoAvailableActions } from "./NoAvailableActions";
import {
  getSelected,
  getSelectedSecondary,
} from "../../../components/selection";
import { ShipToEntity } from "./ShipToEntity";

export const ContextMenu: React.FC = () => {
  const [sim] = useSim();

  const selectedEntity = getSelected(sim);
  const actionable = getSelectedSecondary(sim);

  if (actionable) {
    return <ShipToEntity />;
  }

  if (selectedEntity?.hasComponents(shipComponents)) {
    return <ShipToSpace />;
  }

  return <NoAvailableActions />;
};

ContextMenu.displayName = "ContextMenu";
