import React from "react";
import {
  asteroidFieldComponents,
  type AsteroidField,
} from "@core/archetypes/asteroidField";
import { createWaypoint } from "@core/archetypes/waypoint";
import { mineAction } from "@core/components/orders";
import { moveToActions } from "@core/utils/moving";
import { DropdownOption } from "@kit/Dropdown";
import { isOwnedByPlayer } from "@core/utils/misc";
import { useGameStore } from "@ui/state/game";
import { useContextMenuStore } from "@ui/state/contextMenu";
import { entityIndexer } from "@core/entityIndexer/entityIndexer";
import { find } from "@fxts/core";
import {
  commodityLabel,
  type MineableCommodity,
} from "@core/economy/commodity";
import { Vec2 } from "ogl";
import { useSim } from "../../atoms";
import { NoAvailableActions } from "./NoAvailableActions";
import { Wrapper } from "./Wrapper";

const tempVec2 = new Vec2(0, 0);

export const ShipToSpace: React.FC = () => {
  const [sim] = useSim();
  const [[menu], menuStore] = useContextMenuStore((store) => [store.state]);
  const [[selected]] = useGameStore((store) => [store.selectedUnits]);

  const canBeOrdered =
    selected.length > 0 &&
    isOwnedByPlayer(selected[0]) &&
    selected.every((unit) => unit.hasComponents(["orders", "position"]));

  const fieldToMine = selected.every((unit) => unit.hasComponents(["mining"]))
    ? find(
        (field) =>
          field.cp.mineable.fPoints.some(
            ([pos, size]) =>
              tempVec2
                .set(field.cp.position.coord)
                .add(pos)
                .squaredDistance(menu.worldPosition) <=
              size ** 2
          ) && menu.sector?.id === field.cp.position.sector,
        entityIndexer.search(asteroidFieldComponents)
      )
    : null;

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

  const onMine = (field: AsteroidField, commodity: MineableCommodity) => {
    for (const unit of selected) {
      unit.cp.orders!.value.push({
        origin: "manual",
        type: "mine",
        actions: [
          ...moveToActions(unit, field),
          mineAction({
            targetFieldId: field.id,
            resource: commodity,
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

  React.useEffect(() => {
    if (
      canBeOrdered &&
      !fieldToMine &&
      selected.every((unit) => !unit.cp.deployable)
    ) {
      onMove();
      menuStore.close();
    }
  }, []);

  if (!canBeOrdered) {
    return (
      <Wrapper>
        <NoAvailableActions />
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <DropdownOption onClick={onMove}>Move</DropdownOption>
      {!!fieldToMine &&
        Object.keys(fieldToMine.cp.mineable.resources)
          .filter(
            (commodity) => fieldToMine.cp.mineable.resources[commodity] > 0
          )
          .map((commodity) => (
            <DropdownOption
              key={commodity}
              onClick={() =>
                onMine(fieldToMine, commodity as MineableCommodity)
              }
            >
              Mine {commodityLabel[commodity]}
            </DropdownOption>
          ))}
      {selected.length === 1 &&
        selected[0].cp.deployable?.type === "facility" && (
          <DropdownOption onClick={onFacilityDeploy}>
            Deploy Facility
          </DropdownOption>
        )}
    </Wrapper>
  );
};

ShipToSpace.displayName = "ShipToSpace";
