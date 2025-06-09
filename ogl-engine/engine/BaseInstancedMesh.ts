import type { Material } from "@ogl-engine/materials/material";
import type { MeshOptions } from "ogl";
import { InstancedMesh, Mat3, Mat4 } from "ogl";
import { MissingMaterial } from "@ogl-engine/materials/missing/missing";
import type { Destroyable } from "@ogl-engine/types";
import type { Engine3D } from "./engine3d";
import { BaseMesh } from "./BaseMesh";

const tempTrs = new Mat4();
const tempMat3 = new Mat3();

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
        instances: number;
        normalMatrix: boolean;
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

    if (options.instances) {
      this.setInstancesCount(options.instances);
    }

    if (options.normalMatrix) {
      if (!options.instances) {
        throw new Error("normalMatrix requires instances to be set");
      }

      this.geometry.addAttribute("instanceNormalMatrix", {
        instanced: true,
        size: 9,
        data: new Float32Array(options.instances * 9),
        needsUpdate: true,
      });
    }
  }

  applyMaterial(material: TMaterial): BaseInstancedMesh<TMaterial> {
    this.material = material;
    this.material.apply(this);

    return this;
  }

  setInstancesCount(count: number): void {
    this.geometry.setInstancedCount(count);
    this.geometry.addAttribute("instanceIndex", {
      instanced: true,
      size: 1,
      data: new Uint16Array(count).map((_, i) => i),
    });
    this.geometry.addAttribute("instanceMatrix", {
      instanced: true,
      size: 16,
      data: new Float32Array(count * 16),
      needsUpdate: true,
    });
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

  calculateNormals(): void {
    for (
      let i = 0;
      i < this.geometry.attributes.instanceMatrix.data!.length / 16;
      i++
    ) {
      const trs = tempTrs.fromArray(
        this.geometry.attributes.instanceMatrix.data!,
        i * 16
      );

      const normalMatrix = tempMat3.getNormalMatrix(trs);
      this.geometry.attributes.instanceNormalMatrix.data!.set(
        normalMatrix,
        i * 9
      );
    }

    this.geometry.attributes.instanceNormalMatrix.needsUpdate = true;
  }

  destroy() {
    for (const cb of this.onDestroyCallbacks) {
      cb();
    }
  }
}
