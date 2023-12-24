import React from "react";
import { createWaypoint } from "@core/archetypes/waypoint";
import { getSelected, getSelectedSecondary } from "@core/components/selection";
import { moveToActions } from "@core/utils/moving";
import { DropdownOption } from "@kit/Dropdown";
import { relationThresholds } from "@core/components/relations";
import { isOwnedByPlayer } from "@core/utils/misc";
import { addSubordinate } from "@core/components/subordinates";
import { findInAncestors } from "@core/utils/findInAncestors";
import type { Position2D } from "@core/components/position";
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
          createWaypoint(sim, {
            sector: menu.sector!.id,
            value: menu.worldPosition as Position2D,
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
    addSubordinate(actionable.requireComponents(["subordinates"]), entity);
  };

  const onBuild = () => {
    entity.cp.orders!.value.push({
      actions: [
        ...moveToActions(
          entity,
          createWaypoint(entity.sim, {
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
          createWaypoint(entity.sim, {
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
    addSubordinate(actionable.requireComponents(["subordinates"]), entity);
    entity.addComponent({
      name: "autoOrder",
      default: {
        type: "escort",
        targetId: actionable.id,
      },
    });
  };

  const teleportModule = actionable.cp.modules?.ids
    .map(sim.getOrThrow)
    .find((e) => e.hasComponents(["teleport"]));

  const onTeleport = () => {
    entity.cp.orders.value.push({
      origin: "manual",
      actions: moveToActions(
        entity,
        findInAncestors(
          sim.getOrThrow(
            teleportModule!.requireComponents(["teleport"]).cp.teleport
              .destinationId!
          ),
          "position"
        )
      ),
      type: "move",
    });
  };

  if (teleportModule) {
    return <DropdownOption onClick={onTeleport}>Jump</DropdownOption>;
  }

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
      {actionable.hasComponents(["drive", "subordinates"]) &&
        actionable.cp.owner?.id === entity.cp.owner?.id && (
          <DropdownOption onClick={onEscort}>Escort</DropdownOption>
        )}
      {entity.hasComponents(["storage"]) &&
        actionable.hasComponents(["trade", "name", "subordinates"]) &&
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
