import { faction } from "@core/archetypes/faction";
import { removeSubordinate } from "@core/components/subordinates";
import { removeOrder } from "@core/systems/orderExecuting/orderExecuting";
import type { RequireComponent } from "@core/tsHelpers";
import Color from "color";

export function transferOwnership(
  entity: RequireComponent<"owner">,
  newOwnerId: number
) {
  const newOwner = faction(entity.sim.getOrThrow(newOwnerId));
  entity.cp.owner.id = newOwnerId;

  if (entity.hasComponents(["commander"])) {
    removeSubordinate(entity.sim.getOrThrow(entity.cp.commander.id), entity);
  }

  if (entity.hasComponents(["orders"])) {
    while (entity.cp.orders.value.length > 0) {
      removeOrder(entity, 0);
    }
  }

  if (entity.cp.children) {
    for (const childId of entity.cp.children.entities) {
      const child = entity.sim.getOrThrow(childId);

      if (child.cp.owner) {
        transferOwnership(child.requireComponents(["owner"]), newOwnerId);
      }
    }
  }

  if (entity.hasComponents(["subordinates"])) {
    for (const subordinateId of entity.cp.subordinates.ids) {
      const subordinate = entity.sim.getOrThrow(subordinateId);
      if (subordinate.hasComponents(["autoOrder", "commander", "orders"])) {
        removeSubordinate(entity, subordinate);
        while (subordinate.cp.orders.value.length > 0) {
          removeOrder(subordinate, 0);
        }
        subordinate.cp.autoOrder.default = {
          type: "hold",
        };
      }
    }
  }

  if (entity.cp.render) {
    entity.cp.render.color = Color(newOwner.cp.color.value).rgbNumber();
  }
}
