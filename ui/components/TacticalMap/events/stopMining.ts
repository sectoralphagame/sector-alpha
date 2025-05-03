import type { RequireComponent } from "@core/tsHelpers";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import type { Entity } from "@core/entity";
import { CloudParticleGenerator } from "@ogl-engine/particles/cloud";
import type { EntityMesh } from "../EntityMesh";

const cloudName = "miningCloud";

export function createStopMiningHandler(
  engine: Engine3D,
  _meshes: WeakMap<Entity, EntityMesh>
) {
  return (entity: RequireComponent<"position">) => {
    const mesh = engine.getByEntityId(entity.id);
    if (!mesh) return;

    const fxs = engine.fxOwners[mesh.id];
    if (fxs) {
      const cloud = fxs.find((child) => child.name === cloudName);
      if (cloud && cloud instanceof CloudParticleGenerator) {
        cloud.markForDestruction();
      }
    }
  };
}
