import { Marker } from "../archetypes/marker";
import { Order } from "../components/orders";

/**
 * Creates array of orders necessary to get to target entity
 */
export function moveToOrders(origin: Marker, target: Marker) {
  const orders: Order[] = [];
  const targetSector = target.cp.position.sectorId.toString();
  const paths = origin.sim.paths[targetSector];

  for (let s = origin.cp.position.sectorId.toString(); s !== targetSector; ) {
    const teleport = origin.sim.queries.teleports
      .get()
      .find(
        (t) =>
          t.cp
            .parent!.value.requireComponents(["position"])
            .cp.position.sectorId.toString() === s &&
          t.cp.teleport.destination.cp
            .parent!.value.requireComponents(["position"])
            .cp.position.sectorId.toString() === paths[s.toString()].predecessor
      );

    orders.push(
      {
        type: "move",
        position: teleport?.cp.parent!.value.requireComponents(["position"])!,
      },
      {
        type: "teleport",
        position:
          teleport?.cp.teleport.destination.cp.parent!.value.requireComponents([
            "position",
          ])!,
      }
    );
    s = paths[s.toString()].predecessor;
  }

  orders.push({ type: "move", position: target });

  return orders;
}
