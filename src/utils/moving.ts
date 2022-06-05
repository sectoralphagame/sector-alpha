import { Marker } from "../archetypes/marker";
import { Order } from "../components/orders";
import { findInAncestors } from "./findInAncestors";

/**
 * Creates array of orders necessary to get to target entity
 */
export function moveToOrders(origin: Marker, target: Marker) {
  const orders: Order[] = [];
  const targetSector = target.cp.position.sector.toString();
  const paths = origin.sim.paths[targetSector];

  for (let s = origin.cp.position.sector.toString(); s !== targetSector; ) {
    const teleport = origin.sim.queries.teleports
      .get()
      .find(
        (t) =>
          findInAncestors(t, "position").cp.position.sector.toString() === s &&
          findInAncestors(
            origin.sim.get(t.cp.teleport.destinationId!),
            "position"
          ).cp.position.sector.toString() === paths[s.toString()].predecessor
      )!;

    const t1 = findInAncestors(teleport, "position");
    const t2 = findInAncestors(
      origin.sim.get(teleport?.cp.teleport.destinationId!),
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
