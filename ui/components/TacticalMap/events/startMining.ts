import type { Engine3D } from "@ogl-engine/engine/engine3d";
import type { Entity } from "@core/entity";
import { CloudParticleGenerator } from "@ogl-engine/particles/cloud";
import type { StartMiningEvent } from "@core/systems/transport3d";
import type { EventHandler } from "@core/utils/pubsub";
import type { EntityMesh } from "../EntityMesh";

const cloudName = "miningCloud";

export function createStartMiningHandler(
  engine: Engine3D,
  _meshes: WeakMap<Entity, EntityMesh>
): EventHandler<StartMiningEvent> {
  return ({ entity }) => {
    const mesh = engine.getByEntityId(entity.id);
    if (mesh && !mesh?.children.some((child) => child.name === cloudName)) {
      const cloud = new CloudParticleGenerator(engine);
      cloud.scale.set(20);
      cloud.name = cloudName;
      cloud.position.set(mesh!.position);
      cloud.setParent(engine.scene);
      engine.fxOwners[mesh.id] ??= [];
      engine.fxOwners[mesh.id].push(cloud);
    }
  };
}
