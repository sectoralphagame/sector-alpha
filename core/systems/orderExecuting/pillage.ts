import type { PillageOrder } from "../../components/orders";
import type { RequireComponent } from "../../tsHelpers";
import { patrolOrder } from "./patrol";

/**
 * Pillage order is really just a patrol order with a special purpose
 */
export function pillageOrder(
  entity: RequireComponent<"drive" | "position" | "damage" | "orders">,
  order: PillageOrder
): boolean {
  return patrolOrder(entity, {
    ...order,
    type: "patrol",
  });
}
