import { Marker } from "../archetypes/marker";
import { Action } from "../components/orders";
import { findInAncestors } from "./findInAncestors";

/**
 * Creates array of actions necessary to get to target entity
 */
export function moveToActions(origin: Marker, target: Marker): Action[] {
  const orders: Action[] = [];
  const targetSector = target.cp.position.sector.toString();
  const paths = origin.sim.paths[targetSector];

  for (let s = origin.cp.position.sector.toString(); s !== targetSector; ) {
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
      return orders;
    }

    const t1 = findInAncestors(teleport, "position");
    const t2 = findInAncestors(
      origin.sim.getOrThrow(teleport?.cp.teleport.destinationId!),
      "position"
    );

    orders.push(
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

  orders.push({
    type: "move",
    targetId: target.id,
  });

  return orders;
}
