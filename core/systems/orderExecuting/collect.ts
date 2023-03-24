import type { Collectible } from "@core/archetypes/collectible";
import type { CollectAction } from "@core/components/orders";
import { addStorage } from "@core/components/storage";
import type { RequireComponent } from "@core/tsHelpers";

export function collectAction(
  entity: RequireComponent<"storage">,
  order: CollectAction
): boolean {
  const collectible = entity.sim.getOrThrow<Collectible>(order.targetId);
  addStorage(
    entity.cp.storage,
    collectible.cp.simpleCommodityStorage.commodity,
    collectible.cp.simpleCommodityStorage.stored,
    false
  );

  collectible.unregister();

  return true;
}
