import { Mesh, Program, Vec3 } from "ogl";
import type { GLTF } from "ogl";
import type { Engine } from "@ogl-engine/engine/engine";
import fragment from "./shader.frag.glsl";
import vertex from "./shader.vert.glsl";

export function createBasicProgram(engine: Engine, material: any) {
  return new Program(engine.gl, {
    vertex,
    fragment,
    uniforms: {
      tDiffuse: { value: material.baseColorTexture.texture },
      tNormal: { value: material.normalTexture.texture },
      lightColor: { value: new Vec3(1, 1, 1) },
      lightDirection: { value: new Vec3(0, 1, 0) },
      uNormalScale: { value: 1 },
      uNormalUVScale: { value: 1 },
      uTime: engine.uniforms.uTime,
    },
  });
}

export function addBasic(engine: Engine, model: GLTF) {
  return new Mesh(engine.renderer.gl, {
    geometry: model.meshes[0].primitives[0].geometry,
    program: createBasicProgram(engine, model.materials[0]),
  });
}
