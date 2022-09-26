import { deepEqual, matrix } from "mathjs";
import React from "react";
import { createMarker } from "../../../archetypes/marker";
import { worldToHecs } from "../../../components/hecsPosition";
import { getSelected } from "../../../components/selection";
import { moveToOrders } from "../../../utils/moving";
import { useSim } from "../../atoms";
import { Menu } from "../../views/Game";
import { DropdownOption } from "../Dropdown";
import { NoAvailableActions } from "./NoAvailableActions";

export const ShipToSpace: React.FC<{ menu: Menu }> = ({ menu }) => {
  const [sim] = useSim();
  const selected = getSelected(sim);
  const canBeOrdered =
    selected!.cp.owner?.id === sim.queries.player.get()[0].id &&
    selected?.hasComponents(["orders", "position"]);
  const sector = sim.queries.sectors
    .get()
    .find((s) =>
      deepEqual(s.cp.hecsPosition.value, worldToHecs(menu.worldPosition))
    );

  if (!(canBeOrdered && sector)) {
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
              sector: sector.id,
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
