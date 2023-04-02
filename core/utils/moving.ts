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
    const teleport = origin.sim.queries.teleports
      .get()
      .find(
        (t) =>
          findInAncestors(t, "position").cp.position.sector.toString() === s &&
          findInAncestors(
            origin.sim.getOrThrow(t.cp.teleport.destinationId!),
            "position"
          ).cp.position.sector.toString() === paths[s.toString()].predecessor
      );

    if (!teleport) {
      return actions;
    }

    const t1 = findInAncestors(teleport, "position");
    const t2 = findInAncestors(
      origin.sim.getOrThrow(teleport?.cp.teleport.destinationId!),
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
