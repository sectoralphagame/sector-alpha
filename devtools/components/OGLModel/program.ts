import type { OGLRenderingContext } from "ogl";
import { Program, Vec3 } from "ogl";
import fragment from "./shader.frag.glsl";
import vertex from "./shader.vert.glsl";

export function createProgram(gl: OGLRenderingContext, node) {
  const gltf = node.program.gltfMaterial || {};
  console.log(gltf);

  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      tDiffuse: { value: gltf.baseColorTexture.texture },
      tNormal: { value: gltf.normalTexture.texture },
      lightColor: { value: new Vec3(1, 1, 1) },
      lightDirection: { value: new Vec3(0.85, 0.8, 0.75) },
    },
  });

  return program;
}
