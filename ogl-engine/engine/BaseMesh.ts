import type { Material } from "@ogl-engine/materials/material";
import type { GLTF, MeshOptions } from "ogl";
import { Mesh } from "ogl";
import { MissingMaterial } from "@ogl-engine/materials/missing/missing";
import type { Engine } from "./engine";

export class BaseMesh<TMaterial extends Material = Material> extends Mesh {
  engine: Engine;
  material: TMaterial;

  constructor(
    engine: Engine,
    options: Partial<MeshOptions & { material: TMaterial }>
  ) {
    super(engine.gl, options);

    this.engine = engine;
    this.applyMaterial(
      options.material ?? (new MissingMaterial(engine) as any)
    );
  }

  applyMaterial(material: TMaterial): BaseMesh<TMaterial> {
    this.material = material;
    this.material.apply(this);

    return this;
  }

  // eslint-disable-next-line no-shadow
  static fromGltf<TMaterial extends Material>(
    engine: Engine,
    gltf: GLTF,
    options?: Partial<MeshOptions & { material: TMaterial }>
  ): BaseMesh<TMaterial> {
    return new BaseMesh<TMaterial>(engine, {
      ...options,
      geometry: gltf.meshes[0].primitives[0].geometry,
      material: options?.material,
    });
  }
}
