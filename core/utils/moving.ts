import { find } from "@fxts/core";
import type { Position2D } from "@core/components/position";
import type { RequireComponent } from "@core/tsHelpers";
import { SectorIndex } from "@core/systems/utils/sectorIndex";
import type { Waypoint } from "../archetypes/waypoint";
import type { Action } from "../components/orders";
import { findInAncestors } from "./findInAncestors";

/**
 * Creates array of actions necessary to get to target entity
 */
export function moveToActions(
  origin: Waypoint,
  target: Waypoint,
  {
    onlyManeuver,
    ignoreReached,
  }: {
    onlyManeuver?: boolean;
    ignoreReached?: true;
  } = {}
): Action[] {
  const actions: Action[] = [];
  const targetSector = target.cp.position.sector.toString();
  const paths = origin.sim.paths[targetSector];

  let s = origin.cp.position.sector.toString();
  while (s !== targetSector) {
    const teleportFacility = find(
      (t) =>
        findInAncestors(t, "position").cp.position.sector.toString() === s &&
        findInAncestors(
          origin.sim.getOrThrow(t.cp.teleport.destinationId!),
          "position"
        ).cp.position.sector.toString() === paths[s.toString()].predecessor,
      origin.sim.queries.teleports.getIt()
    );

    if (!teleportFacility) {
      return actions;
    }

    const t1 = findInAncestors(teleportFacility, "position");
    const t2 = findInAncestors(
      origin.sim.getOrThrow(teleportFacility?.cp.teleport.destinationId!),
      "position"
    );

    actions.push(
      {
        type: "move",
        targetId: t1.id,
      },
      {
        type: "teleport",
        targetId: t2.id,
      }
    );
    s = paths[s.toString()].predecessor;
  }

  actions.push({
    type: "move",
    targetId: target.id,
  });

  const lastAction = actions.at(-1);
  if (lastAction?.type === "move" && onlyManeuver && actions.length === 1) {
    lastAction.onlyManeuver = true;
  }
  if (lastAction?.type === "move" && ignoreReached && actions.length === 1) {
    lastAction.ignoreReached = true;
  }

  return actions;
}

export function teleport(
  entity: RequireComponent<"position">,
  position: Position2D,
  sector: number
) {
  const prevSector = entity.cp.position.sector;

  entity.cp.position = {
    name: "position",
    angle: entity.cp.position.angle,
    coord: [...position],
    sector,
    moved: true,
  };

  entity.cp.docks?.docked.forEach((dockedId) => {
    const docked =
      entity.sim.getOrThrow<RequireComponent<"position">>(dockedId);

    docked.cp.position = {
      name: "position",
      angle: entity.cp.position.angle,
      coord: [...position],
      sector,
      moved: true,
    };
    SectorIndex.notify(prevSector, sector, docked);
  });

  SectorIndex.notify(prevSector, sector, entity);
}
