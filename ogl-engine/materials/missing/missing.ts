import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { Material } from "../material";
import fragment from "./shader.frag.glsl";
import vertex from "../base.vert.glsl";

export class MissingMaterial extends Material {
  constructor(engine: Engine3D) {
    super(engine);

    this.createProgram(vertex, fragment);
  }
}
