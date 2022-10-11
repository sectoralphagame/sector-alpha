import { matrix } from "mathjs";
import React from "react";
import { createMarker } from "../../../archetypes/marker";
import { isOwnedByPlayer } from "../../../components/player";
import {
  getSelected,
  getSelectedSecondary,
} from "../../../components/selection";
import { moveToOrders } from "../../../utils/moving";
import { useContextMenu, useGameDialog, useSim } from "../../atoms";
import { DropdownOption } from "../Dropdown";
import { NoAvailableActions } from "./NoAvailableActions";

export const ShipToEntity: React.FC = () => {
  const [sim] = useSim();
  const [menu] = useContextMenu();
  const selected = getSelected(sim)!;
  const actionable = getSelectedSecondary(sim)!;
  const canBeOrdered =
    isOwnedByPlayer(selected) &&
    selected?.hasComponents(["orders", "position"]);
  const [, setDialog] = useGameDialog();

  if (!canBeOrdered) {
    return <NoAvailableActions />;
  }

  const entity = selected!.requireComponents(["orders", "position"]);

  const onTrade = () => {
    setDialog({
      type: "trade",
      initiator: selected.id,
      target: actionable.id,
    });
  };

  const onDock = () => {
    entity.cp.orders!.value.push({
      origin: "manual",
      type: "dock",
      orders: [
        ...moveToOrders(
          entity,
          createMarker(sim, {
            sector: menu.sector!.id,
            value: matrix(menu.worldPosition),
          })
        ),
        { type: "dock", targetId: actionable.id },
      ],
    });
  };

  return (
    <>
      {actionable.hasComponents(["trade"]) && (
        <DropdownOption onClick={onTrade}>Trade</DropdownOption>
      )}
      {actionable.hasComponents(["docks"]) && (
        <DropdownOption onClick={onDock}>Dock</DropdownOption>
      )}
    </>
  );
};

ShipToEntity.displayName = "ShipToEntity";
