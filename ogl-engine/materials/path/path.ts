import type { Engine } from "@ogl-engine/engine/engine";
import { Program } from "ogl";
import fragment from "./shader.frag.glsl";
import vertex from "./shader.vert.glsl";

export function createPathMaterialProgram(engine: Engine) {
  return new Program(engine.gl, {
    vertex,
    fragment,
  });
}
