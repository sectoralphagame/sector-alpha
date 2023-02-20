import { createBudget } from "@core/components/budget";
import type { CoreComponents } from "@core/components/component";
import { createDocks } from "@core/components/dockable";
import type { BuilderDeployAction } from "@core/components/orders";
import { createTrade } from "@core/components/trade";
import type { RequireComponent } from "@core/tsHelpers";

export function deployBuilderAction(
  entity: RequireComponent<"deployable" | "storage">,
  order: BuilderDeployAction
): boolean {
  (["autoOrder", "orders"] as Array<keyof CoreComponents>).reduce(
    (ship, component) => ship.removeComponent(component),
    entity
  );

  entity
    .addComponent(createBudget())
    .addComponent(createDocks({ large: 1, medium: 3, small: 3 }))
    .addComponent(createTrade())
    .addComponent({ name: "builder", targetId: order.targetId })
    .addComponent({
      name: "storageBonus",
      value: 1e6 - entity.cp.storage!.max,
    });

  entity.cp.trade!.auto = { pricing: false, quantity: false };
  entity.cp.deployable.active = true;
  entity.cp.storage!.max = 1e6;

  return true;
}
