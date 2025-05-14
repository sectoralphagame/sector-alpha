import type { Engine3D } from "@ogl-engine/engine/engine3d";
import fragment from "./shader.frag.glsl";
import vertex from "./shader.vert.glsl";
import { Material } from "../material";

interface GridMaterialArgs {}

export class GridMaterial extends Material {
  uniforms: Material["uniforms"] & {};

  constructor(engine: Engine3D, _args: GridMaterialArgs = {}) {
    super(engine);

    this.createProgram(
      vertex,
      fragment,
      {},
      {
        transparent: true,
        cullFace: false,
      }
    );
  }
}
