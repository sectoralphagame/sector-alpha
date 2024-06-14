import type { EscortOrder } from "@core/components/orders";
import type { RequireComponent } from "@core/tsHelpers";
import { followOrder, followOrderCompleted } from "./follow";

export function escortOrder(
  entity: RequireComponent<"damage" | "drive" | "position" | "orders">,
  group: EscortOrder
) {
  followOrder(entity, {
    ...group,
    type: "follow",
  });
}

export function escortOrderCompleted(
  entity: RequireComponent<"drive" | "movable" | "position" | "orders">
) {
  followOrderCompleted(entity);
}
