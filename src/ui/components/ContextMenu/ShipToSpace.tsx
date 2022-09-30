import { matrix } from "mathjs";
import React from "react";
import { createMarker } from "../../../archetypes/marker";
import { getSelected } from "../../../components/selection";
import { moveToOrders } from "../../../utils/moving";
import { useContextMenu, useSim } from "../../atoms";
import { DropdownOption } from "../Dropdown";
import { NoAvailableActions } from "./NoAvailableActions";

export const ShipToSpace: React.FC = () => {
  const [sim] = useSim();
  const [menu] = useContextMenu();
  const selected = getSelected(sim);
  const canBeOrdered =
    selected!.cp.owner?.id === sim.queries.player.get()[0].id &&
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
