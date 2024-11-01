import type { RequireComponent } from "@core/tsHelpers";
import { assetLoader } from "@ogl-engine/AssetLoader";
import { createBasicProgram } from "@ogl-engine/loaders/basic/basic";
import type { OGLRenderingContext } from "ogl";
import { Mesh } from "ogl";

export interface EntityMesh extends Mesh {
  entityId: number;
}

export function createEntityMesh(
  entity: RequireComponent<"render">,
  gl: OGLRenderingContext
): EntityMesh {
  const m = new Mesh(gl, {
    geometry: assetLoader.model(entity.cp.render.model).geometry,
    program: createBasicProgram(
      gl,
      assetLoader.model(entity.cp.render.model).material
    ),
  }) as EntityMesh;
  m.entityId = entity.id;
  m.scale.set(1 / 180);

  return m;
}
