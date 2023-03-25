import { add, matrix, random } from "mathjs";
import React from "react";
import { createMarker } from "@core/archetypes/marker";
import { getSelected, getSelectedSecondary } from "@core/components/selection";
import { moveToActions } from "@core/utils/moving";
import { DropdownOption } from "@kit/Dropdown";
import { relationThresholds } from "@core/components/relations";
import { isOwnedByPlayer } from "@core/utils/misc";
import { useContextMenu, useGameDialog, useSim } from "../../atoms";
import { NoAvailableActions } from "./NoAvailableActions";

export const ShipToEntity: React.FC = () => {
  const [sim] = useSim();
  const [menu] = useContextMenu();
  const selected = getSelected(sim)!;

  if (!selected) {
    return null;
  }

  const actionable = getSelectedSecondary(sim)!;
  const canBeOrdered =
    isOwnedByPlayer(selected) &&
    selected?.hasComponents(["orders", "position"]);
  const [, setDialog] = useGameDialog();

  if (!canBeOrdered) {
    return <NoAvailableActions />;
  }

  const entity = selected!.requireComponents(["orders", "position"]);
  const actionableRelationship = actionable.cp.owner?.id
    ? sim.queries.player.get()[0].cp.relations.values[actionable.cp.owner?.id]
    : 0;

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
      actions: [
        ...moveToActions(
          entity,
          createMarker(sim, {
            sector: menu.sector!.id,
            value: matrix(menu.worldPosition),
            owner: entity.id,
          })
        ),
        { type: "dock", targetId: actionable.id },
      ],
    });
  };

  const onFollow = () => {
    entity.cp.orders!.value.push({
      origin: "manual",
      type: "follow",
      targetId: actionable.id,
      actions: [],
      ordersForSector: 0,
    });
  };

  const onWorkFor = () => {
    entity.cp.orders!.value = [];
    entity.addComponent({
      name: "commander",
      id: actionable.id,
    });
  };

  const onBuild = () => {
    entity.cp.orders!.value.push({
      actions: [
        ...moveToActions(
          entity,
          createMarker(entity.sim, {
            sector: actionable.cp.position.sector,
            value: actionable.cp.position.coord,
            owner: entity.id,
          })
        ),
        {
          type: "deployBuilder",
          targetId: actionable.id,
        },
      ],
      origin: "manual",
      type: "deployBuilder",
    });
  };

  const onAttack = () => {
    entity.cp.orders!.value.push({
      origin: "manual",
      type: "attack",
      targetId: actionable.id,
      actions: [],
      ordersForSector: 0,
      followOutsideSector: true,
    });
  };

  const onCollect = () => {
    entity.cp.orders!.value.push({
      origin: "manual",
      type: "collect",
      actions: [
        ...moveToActions(
          entity,
          createMarker(entity.sim, {
            sector: actionable.cp.position.sector,
            value: actionable.cp.position.coord,
            owner: entity.id,
          })
        ),
        {
          type: "collect",
          targetId: actionable.id,
        },
      ],
    });
  };

  const onEscort = () => {
    entity.cp.orders!.value.push({
      origin: "manual",
      type: "escort",
      targetId: actionable.id,
      actions: [],
      ordersForSector: 0,
    });
  };

  return (
    <>
      {actionable.hasComponents(["trade"]) &&
        actionableRelationship > relationThresholds.trade && (
          <DropdownOption onClick={onTrade}>Trade</DropdownOption>
        )}
      {actionable.hasComponents(["docks"]) &&
        actionableRelationship > relationThresholds.trade && (
          <DropdownOption onClick={onDock}>Dock</DropdownOption>
        )}
      {actionable.hasComponents(["drive"]) && (
        <DropdownOption onClick={onFollow}>Follow</DropdownOption>
      )}
      {actionable.hasComponents(["drive"]) &&
        actionable.cp.owner?.id === entity.cp.owner?.id && (
          <DropdownOption onClick={onEscort}>Escort</DropdownOption>
        )}
      {entity.hasComponents(["storage"]) &&
        actionable.hasComponents(["trade", "name"]) &&
        isOwnedByPlayer(actionable) && (
          <DropdownOption onClick={onWorkFor}>
            Work for {actionable.cp.name!.value}
          </DropdownOption>
        )}
      {entity.hasComponents(["deployable"]) &&
        actionable.hasComponents(["facilityModuleQueue"]) &&
        isOwnedByPlayer(actionable) && (
          <DropdownOption onClick={onBuild}>Build</DropdownOption>
        )}
      {entity.hasComponents(["damage"]) &&
        actionable.hasComponents(["hitpoints"]) && (
          <DropdownOption onClick={onAttack}>Attack</DropdownOption>
        )}
      {entity.hasComponents(["storage"]) &&
        actionable.hasComponents(["simpleCommodityStorage"]) && (
          <DropdownOption onClick={onCollect}>Collect</DropdownOption>
        )}
    </>
  );
};

ShipToEntity.displayName = "ShipToEntity";
