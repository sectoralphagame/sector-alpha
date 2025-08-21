import type { RequireComponent } from "@core/tsHelpers";
import { applyParentTransform } from "@core/systems/moving";
import type { Entity } from "@core/entity";
import { componentLogger } from "@core/log";
import type { BaseComponent } from "./component";

export type ChildRole = "turret";
export interface Children extends BaseComponent<"children"> {
  slots: Array<{ slug: string; angle: number }>;
  entities: Array<{
    role: ChildRole;
    id: number;
    slot: string;
  }>;
}

export function attach(
  child: Entity,
  parent: RequireComponent<"children">,
  slot: string,
  role: ChildRole
) {
  if (!parent.cp.children.slots.some(({ slug }) => slug === slot)) {
    throw new Error(`Slot ${slot} does not exist on parent entity`);
  }

  if (!child.hasComponents(["parent"])) {
    child.addComponent({
      name: "parent",
      id: parent.id,
    });
  } else {
    componentLogger.log(
      `Entity ${child.id} already has a parent, replacing with new parent ${parent.id}`,
      "warn"
    );
    child.cp.parent.id = parent.id;
  }

  parent.cp.children.entities.push({
    id: child.id,
    role,
    slot,
  });

  if (
    child.hasComponents(["transform"]) &&
    parent.hasComponents(["position"])
  ) {
    applyParentTransform(child, parent.cp.position);
  }
}
