import { createWaypoint } from "@core/archetypes/waypoint";
import { sectorSize } from "@core/archetypes/sector";
import type { Sector } from "@core/archetypes/sector";
import { hecsToCartesian } from "@core/components/hecsPosition";
import { random } from "lodash";
import { add, multiply, randomInt, subtract } from "mathjs";
import type { Position2D } from "@core/components/position";
import type { PatrolOrder } from "../../components/orders";
import type { RequireComponent } from "../../tsHelpers";
import { moveToActions } from "../../utils/moving";

export function patrolOrder(
  entity: RequireComponent<"drive" | "position" | "damage" | "orders">,
  order: PatrolOrder
): boolean {
  const targetSector = entity.sim.getOrThrow<Sector>(order.sectorId);

  if (order.actions.length === 0) {
    const sectorPosition = hecsToCartesian(
      targetSector.cp.hecsPosition.value,
      sectorSize / 10
    );

    let waypointPosition: Position2D;

    if (entity.cp.position.sector === targetSector.id) {
      const pos = subtract(entity.cp.position.coord, sectorPosition);
      const angle = Math.atan2(pos[1], pos[0]);
      const angleOffset =
        (Math.PI / randomInt(4, 8)) * (order.clockwise ? 1 : -1);

      waypointPosition = add(
        sectorPosition,
        multiply(
          [Math.cos(angle + angleOffset), Math.sin(angle + angleOffset)],
          random(sectorSize / 30, sectorSize / 15)
        )
      ) as Position2D;
    } else {
      waypointPosition = add(sectorPosition, [
        random(-sectorSize / 20, sectorSize / 20),
        random(-sectorSize / 20, sectorSize / 20),
      ]) as Position2D;
    }

    entity.cp.orders.value[0].actions = moveToActions(
      entity,
      createWaypoint(entity.sim, {
        sector: targetSector.id,
        value: waypointPosition,
        owner: entity.id,
      })
    );
  }

  return false;
}
