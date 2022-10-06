import { matrix } from "mathjs";
import React from "react";
import { createMarker } from "../../../archetypes/marker";
import { isOwnedByPlayer } from "../../../components/player";
import { getSelected } from "../../../components/selection";
import { moveToOrders } from "../../../utils/moving";
import { useContextMenu, useSim } from "../../atoms";
import { DropdownOption } from "../Dropdown";
import { NoAvailableActions } from "./NoAvailableActions";

export const ShipToSpace: React.FC = () => {
  const [sim] = useSim();
  const [menu] = useContextMenu();
  const selected = getSelected(sim)!;
  const canBeOrdered =
    isOwnedByPlayer(selected) &&
    selected?.hasComponents(["orders", "position"]);

  if (!canBeOrdered) {
    return <NoAvailableActions />;
  }

  const entity = selected!.requireComponents(["orders", "position"]);

  return (
    <DropdownOption
      onClick={() => {
        entity.cp.orders!.value.push({
          type: "move",
          orders: moveToOrders(
            entity,
            createMarker(sim, {
              sector: menu.sector!.id,
              value: matrix(menu.worldPosition),
            })
          ),
        });
      }}
    >
      Move
    </DropdownOption>
  );
};

ShipToSpace.displayName = "ShipToSpace";
