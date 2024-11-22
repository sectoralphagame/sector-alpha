import type { Engine } from "@ogl-engine/engine/engine";
import { Program } from "ogl";
import { Material } from "../material";
import fragment from "./shader.frag.glsl";
import vertex from "./shader.vert.glsl";

export class MissingMaterial extends Material {
  constructor(engine: Engine) {
    super(engine);

    this.program = new Program(engine.gl, {
      vertex,
      fragment,
    });
  }
}
