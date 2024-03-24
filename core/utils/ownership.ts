import { faction } from "@core/archetypes/faction";
import { removeSubordinate } from "@core/components/subordinates";
import type { RequireComponent } from "@core/tsHelpers";
import Color from "color";

export function transferOwnership(
  entity: RequireComponent<"owner">,
  newOwnerId: number
) {
  const newOwner = faction(entity.sim.getOrThrow(newOwnerId));
  entity.cp.owner.id = newOwnerId;

  if (entity.cp.commander) {
    removeSubordinate(
      entity.sim.getOrThrow(entity.cp.commander.id),
      entity.requireComponents(["commander"])
    );
  }

  if (entity.cp.children) {
    for (const childId of entity.cp.children.entities) {
      const child = entity.sim.getOrThrow(childId);

      if (child.cp.owner) {
        transferOwnership(child.requireComponents(["owner"]), newOwnerId);
      }
    }
  }

  if (entity.cp.render) {
    entity.cp.render.color = Color(newOwner.cp.color.value).rgbNumber();
  }
}
