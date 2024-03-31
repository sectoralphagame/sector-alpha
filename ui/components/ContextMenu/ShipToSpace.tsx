import { norm, subtract } from "mathjs";
import React from "react";
import type { AsteroidField } from "@core/archetypes/asteroidField";
import { createWaypoint } from "@core/archetypes/waypoint";
import { mineAction } from "@core/components/orders";
import { getSelected } from "@core/components/selection";
import { moveToActions } from "@core/utils/moving";
import { DropdownOption } from "@kit/Dropdown";
import { isOwnedByPlayer } from "@core/utils/misc";
import type { Position2D } from "@core/components/position";
import { useContextMenu, useSim } from "../../atoms";
import { NoAvailableActions } from "./NoAvailableActions";

export const ShipToSpace: React.FC = () => {
  const [sim] = useSim();
  const [menu] = useContextMenu();
  const selected = getSelected(sim)!;

  if (!selected) {
    return null;
  }

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
            (norm(
              subtract(field.cp.position.coord, menu.worldPosition)
            ) as number) < field.cp.asteroidSpawn.size
        )
    : [];

  const entity = selected!.requireComponents(["orders", "position"]);

  const onMove = () => {
    entity.cp.orders!.value.push({
      origin: "manual",
      type: "move",
      actions: moveToActions(
        entity,
        createWaypoint(sim, {
          sector: menu.sector!.id,
          value: menu.worldPosition as Position2D,
          owner: entity.id,
        })
      ),
    });
  };

  const onMine = (field: AsteroidField) => {
    entity.cp.orders!.value.push({
      origin: "manual",
      type: "mine",
      actions: [
        ...moveToActions(entity, field),
        mineAction({
          targetFieldId: field.id,
          targetRockId: null,
        }),
      ],
    });
  };

  const onFacilityDeploy = () => {
    entity.cp.orders!.value.push({
      origin: "manual",
      type: "move",
      actions: [
        ...moveToActions(
          entity,
          createWaypoint(sim, {
            sector: menu.sector!.id,
            value: menu.worldPosition as Position2D,
            owner: entity.id,
          })
        ),
        {
          type: "deployFacility",
        },
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
      {entity.cp.deployable?.type === "facility" && (
        <DropdownOption onClick={onFacilityDeploy}>
          Deploy Facility
        </DropdownOption>
      )}
    </>
  );
};

ShipToSpace.displayName = "ShipToSpace";
