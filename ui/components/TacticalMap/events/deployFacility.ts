import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { gameStore } from "@ui/state/game";
import type { EventHandler } from "@core/utils/pubsub";
import type { DeployFacilityEvent } from "@core/systems/transport3d";
import type { EntityMesh } from "../EntityMesh";

export function createDeployFacilityHandler(
  engine: Engine3D,
  meshes: WeakMap<{ id: number }, EntityMesh>
): EventHandler<DeployFacilityEvent> {
  return ({ entity }) => {
    const mesh = engine.getByEntityId(entity.id);
    mesh?.destroy();
    mesh?.setParent(null);
    meshes.delete(entity);
    gameStore.clearSelection();
  };
}
