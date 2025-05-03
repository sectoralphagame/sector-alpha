import type { Material } from "@ogl-engine/materials/material";
import type { MeshOptions } from "ogl";
import { InstancedMesh } from "ogl";
import { MissingMaterial } from "@ogl-engine/materials/missing/missing";
import type { Destroyable } from "@ogl-engine/types";
import type { Engine3D } from "./engine3d";
import { BaseMesh } from "./BaseMesh";

export class BaseInstancedMesh<TMaterial extends Material = Material>
  extends InstancedMesh
  implements Destroyable
{
  engine: Engine3D;
  name = "BaseInstancedMesh";
  material: TMaterial;
  tangents = true;
  onDestroyCallbacks: (() => void)[] = [];

  constructor(
    engine: Engine3D,
    options: Partial<
      MeshOptions & {
        material: TMaterial;
        name: string;
        calculateTangents: boolean;
      }
    >
  ) {
    super(engine.gl, options);

    if (options.name) {
      this.name = options.name;
    }

    this.engine = engine;
    this.applyMaterial(
      options.material ?? (new MissingMaterial(engine) as any)
    );

    if (this.geometry && !this.geometry.attributes.tangent && this.tangents) {
      this.calculateTangents();
    }
  }

  applyMaterial(material: TMaterial): BaseInstancedMesh<TMaterial> {
    this.material = material;
    this.material.apply(this);

    return this;
  }

  private calculateTangents(): void {
    const vertices = this.geometry.attributes.position.data!;
    const indices = this.geometry.attributes.index.data!;
    const uvs = this.geometry.attributes.uv.data!;

    const tangents = BaseMesh.getTangents(vertices, uvs, indices);
    this.geometry.addAttribute("tangent", {
      size: 3,
      data: tangents,
    });
  }

  destroy() {
    for (const cb of this.onDestroyCallbacks) {
      cb();
    }
  }
}
