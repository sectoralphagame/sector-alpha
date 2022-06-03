import { Marker } from "../archetypes/marker";
import { Order } from "../components/orders";
import { findInAncestors } from "./findInAncestors";

/**
 * Creates array of orders necessary to get to target entity
 */
export function moveToOrders(origin: Marker, target: Marker) {
  const orders: Order[] = [];
  const targetSector = target.cp.position.entityId.toString();
  const paths = origin.sim.paths[targetSector];

  for (let s = origin.cp.position.entityId.toString(); s !== targetSector; ) {
    const teleport = origin.sim.queries.teleports
      .get()
      .find(
        (t) =>
          findInAncestors(t, "position").cp.position.entityId.toString() ===
            s &&
          findInAncestors(
            t.cp.teleport.entity!,
            "position"
          ).cp.position.entityId.toString() === paths[s.toString()].predecessor
      )!;

    const t1 = findInAncestors(teleport, "position");
    const t2 = findInAncestors(teleport?.cp.teleport.entity!, "position");

    orders.push(
      {
        type: "move",
        position: { entity: t1, entityId: t1.id },
      },
      {
        type: "teleport",
        position: { entity: t2, entityId: t2.id },
      }
    );
    s = paths[s.toString()].predecessor;
  }

  orders.push({
    type: "move",
    position: {
      entity: target,
      entityId: target.id,
    },
  });

  return orders;
}
