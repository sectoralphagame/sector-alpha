import React from "react";
import { createWaypoint } from "@core/archetypes/waypoint";
import { moveToActions } from "@core/utils/moving";
import { DropdownOption } from "@kit/Dropdown";
import { relationThresholds } from "@core/components/relations";
import { isOwnedByPlayer } from "@core/utils/misc";
import { addSubordinate } from "@core/components/subordinates";
import { findInAncestors } from "@core/utils/findInAncestors";
import type { Position2D } from "@core/components/position";
import { useGameStore } from "@ui/state/game";
import { useContextMenuStore } from "@ui/state/contextMenu";
import { useGameDialog, useSim } from "../../atoms";
import { NoAvailableActions } from "./NoAvailableActions";

export const ShipToEntity: React.FC = () => {
  const [sim] = useSim();
  const [[menu]] = useContextMenuStore((store) => [store.state]);
  const [[selected]] = useGameStore((store) => [store.selectedUnit]);

  if (!selected) {
    return null;
  }

  const canBeOrdered =
    isOwnedByPlayer(selected) &&
    selected?.hasComponents(["orders", "position"]);
  const [, setDialog] = useGameDialog();

  if (!canBeOrdered) {
    return <NoAvailableActions />;
  }

  const entity = selected!.requireComponents(["orders", "position"]);
  const actionableRelationship = menu.target!.cp.owner?.id
    ? sim.index.player.get()[0].cp.relations.values[menu.target!.cp.owner?.id]
    : 0;

  const onTrade = () => {
    setDialog({
      type: "trade",
      initiator: selected.id,
      target: menu.target!.id,
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
        { type: "dock", targetId: menu.target!.id },
      ],
    });
  };

  const onFollow = () => {
    entity.cp.orders!.value.push({
      origin: "manual",
      type: "follow",
      targetId: menu.target!.id,
      actions: [],
      ordersForSector: 0,
    });
  };

  const onWorkFor = () => {
    entity.cp.orders!.value = [];
    addSubordinate(menu.target!.requireComponents(["subordinates"]), entity);
  };

  const onBuild = () => {
    entity.cp.orders!.value.push({
      actions: [
        ...moveToActions(
          entity,
          createWaypoint(entity.sim, {
            sector: menu.target!.cp.position!.sector,
            value: menu.target!.cp.position!.coord,
            owner: entity.id,
          })
        ),
        {
          type: "deployBuilder",
          targetId: menu.target!.id,
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
      targetId: menu.target!.id,
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
            sector: menu.target!.cp.position!.sector,
            value: menu.target!.cp.position!.coord,
            owner: entity.id,
          })
        ),
        {
          type: "collect",
          targetId: menu.target!.id,
        },
      ],
    });
  };

  const onEscort = () => {
    addSubordinate(menu.target!.requireComponents(["subordinates"]), entity);
    entity.addComponent({
      name: "autoOrder",
      default: {
        type: "escort",
        targetId: menu.target!.id,
      },
    });
  };

  const teleportModule = menu
    .target!.cp.modules?.ids.map(sim.getOrThrow)
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
      {menu.target!.hasComponents(["trade"]) &&
        actionableRelationship > relationThresholds.trade && (
          <DropdownOption onClick={onTrade}>Trade</DropdownOption>
        )}
      {menu.target!.hasComponents(["docks"]) &&
        actionableRelationship > relationThresholds.trade && (
          <DropdownOption onClick={onDock}>Dock</DropdownOption>
        )}
      {menu.target!.hasComponents(["drive"]) && (
        <DropdownOption onClick={onFollow}>Follow</DropdownOption>
      )}
      {menu.target!.hasComponents(["drive", "subordinates"]) &&
        menu.target!.cp.owner?.id === entity.cp.owner?.id && (
          <DropdownOption onClick={onEscort}>Escort</DropdownOption>
        )}
      {entity.hasComponents(["storage"]) &&
        menu.target!.hasComponents(["trade", "name", "subordinates"]) &&
        isOwnedByPlayer(menu.target!) && (
          <DropdownOption onClick={onWorkFor}>
            Work for {menu.target!.cp.name!.value}
          </DropdownOption>
        )}
      {entity.hasComponents(["deployable"]) &&
        menu.target!.hasComponents(["facilityModuleQueue"]) &&
        isOwnedByPlayer(menu.target!) && (
          <DropdownOption onClick={onBuild}>Build</DropdownOption>
        )}
      {entity.hasComponents(["damage"]) &&
        menu.target!.hasComponents(["hitpoints"]) && (
          <DropdownOption onClick={onAttack}>Attack</DropdownOption>
        )}
      {entity.hasComponents(["storage"]) &&
        menu.target!.hasComponents(["simpleCommodityStorage"]) && (
          <DropdownOption onClick={onCollect}>Collect</DropdownOption>
        )}
    </>
  );
};

ShipToEntity.displayName = "ShipToEntity";
