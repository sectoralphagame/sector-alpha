import { createBudget } from "@core/components/budget";
import { CoreComponents } from "@core/components/component";
import { createDocks } from "@core/components/dockable";
import { BuilderDeployAction } from "@core/components/orders";
import { createTrade } from "@core/components/trade";
import { RequireComponent } from "@core/tsHelpers";

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
    .addComponent({ name: "builder", targetId: order.targetId });

  entity.cp.deployable.active = true;
  entity.cp.storage!.max = 1e6;

  return true;
}
