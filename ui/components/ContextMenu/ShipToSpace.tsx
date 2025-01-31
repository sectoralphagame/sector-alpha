import { norm, subtract } from "mathjs";
import React from "react";
import type { AsteroidField } from "@core/archetypes/asteroidField";
import { createWaypoint } from "@core/archetypes/waypoint";
import { mineAction } from "@core/components/orders";
import { moveToActions } from "@core/utils/moving";
import { DropdownOption } from "@kit/Dropdown";
import { isOwnedByPlayer } from "@core/utils/misc";
import { useGameStore } from "@ui/state/game";
import { useContextMenuStore } from "@ui/state/contextMenu";
import { useSim } from "../../atoms";
import { NoAvailableActions } from "./NoAvailableActions";

export const ShipToSpace: React.FC = () => {
  const [sim] = useSim();
  const [[menu]] = useContextMenuStore((store) => [store.state]);
  const [[selected]] = useGameStore((store) => [store.selectedUnits]);

  if (!selected.length) {
    return null;
  }

  const canBeOrdered =
    isOwnedByPlayer(selected[0]) &&
    selected.every((unit) => unit.hasComponents(["orders", "position"]));

  if (!canBeOrdered) {
    return <NoAvailableActions />;
  }

  const fieldsToMine = selected.every((unit) => unit.hasComponents(["mining"]))
    ? sim.index.asteroidFields
        .get()
        .filter(
          (field) =>
            (norm(
              subtract(field.cp.position.coord, menu.worldPosition)
            ) as number) < field.cp.asteroidSpawn.size &&
            menu.sector?.id === field.cp.position.sector
        )
    : [];

  const onMove = () => {
    for (const unit of selected) {
      unit.cp.orders!.value.push({
        origin: "manual",
        type: "move",
        actions: moveToActions(
          unit,
          createWaypoint(sim, {
            sector: menu.sector!.id,
            value: menu.worldPosition,
            owner: unit.id,
          })
        ),
      });
    }
  };

  const onMine = (field: AsteroidField) => {
    for (const unit of selected) {
      unit.cp.orders!.value.push({
        origin: "manual",
        type: "mine",
        actions: [
          ...moveToActions(unit, field),
          mineAction({
            targetFieldId: field.id,
            targetRockId: null,
          }),
        ],
      });
    }
  };

  const onFacilityDeploy = () => {
    const unit = selected[0];
    unit.cp.orders!.value.push({
      origin: "manual",
      type: "move",
      actions: [
        ...moveToActions(
          unit,
          createWaypoint(sim, {
            sector: menu.sector!.id,
            value: menu.worldPosition,
            owner: unit.id,
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
      {selected.length === 1 &&
        selected[0].cp.deployable?.type === "facility" && (
          <DropdownOption onClick={onFacilityDeploy}>
            Deploy Facility
          </DropdownOption>
        )}
    </>
  );
};

ShipToSpace.displayName = "ShipToSpace";
