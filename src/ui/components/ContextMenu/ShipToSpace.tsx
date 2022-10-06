import { matrix, norm, subtract } from "mathjs";
import React from "react";
import { Asteroid } from "../../../archetypes/asteroid";
import { AsteroidField } from "../../../archetypes/asteroidField";
import { createMarker } from "../../../archetypes/marker";
import { mineOrder } from "../../../components/orders";
import { isOwnedByPlayer } from "../../../components/player";
import { getSelected } from "../../../components/selection";
import { pickRandom } from "../../../utils/generators";
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

  const fieldsToMine = selected.cp.mining
    ? sim.queries.asteroidFields
        .get()
        .filter(
          (field) =>
            norm(
              subtract(field.cp.position.coord, matrix(menu.worldPosition))
            ) < field.cp.asteroidSpawn.size
        )
    : [];

  const entity = selected!.requireComponents(["orders", "position"]);

  const onMove = () => {
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
  };

  const onMine = (field: AsteroidField) => {
    const asteroid = sim.getOrThrow<Asteroid>(
      pickRandom(field.cp.children.entities)
    );

    entity.cp.orders!.value.push({
      type: "mine",
      orders: [
        ...moveToOrders(entity, asteroid),
        mineOrder({
          targetFieldId: field.id,
          targetRockId: asteroid.id,
        }),
      ],
    });
  };

  return (
    <>
      <DropdownOption onClick={onMove}>Move</DropdownOption>
      {fieldsToMine.length > 0 &&
        fieldsToMine.map((field) => (
          <DropdownOption key={field.id} onClick={() => onMine(field)}>
            Mine {field.cp.asteroidSpawn.type}
          </DropdownOption>
        ))}
    </>
  );
};

ShipToSpace.displayName = "ShipToSpace";
