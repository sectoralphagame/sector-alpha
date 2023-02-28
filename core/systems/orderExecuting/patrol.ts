import { createMarker } from "@core/archetypes/marker";
import type { Sector } from "@core/archetypes/sector";
import { sectorSize } from "@core/archetypes/sector";
import { hecsToCartesian } from "@core/components/hecsPosition";
import { random } from "lodash";
import { add, matrix } from "mathjs";
import type { PatrolOrder } from "../../components/orders";
import type { RequireComponent } from "../../tsHelpers";
import { moveToActions } from "../../utils/moving";

export function patrolOrder(
  entity: RequireComponent<"drive" | "position" | "damage" | "orders">,
  order: PatrolOrder
): boolean {
  const targetSector = entity.sim.getOrThrow<Sector>(order.sectorId);

  if (order.actions.length === 0) {
    entity.cp.orders.value[0].actions = moveToActions(
      entity,
      createMarker(entity.sim, {
        sector: targetSector.id,
        value: add(
          hecsToCartesian(targetSector.cp.hecsPosition.value, sectorSize / 10),
          matrix([
            random(-sectorSize / 20, sectorSize / 20),
            random(-sectorSize / 20, sectorSize / 20),
          ])
        ),
      })
    );
  }

  return false;
}
