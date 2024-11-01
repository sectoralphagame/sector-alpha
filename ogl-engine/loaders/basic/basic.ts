import { Mesh, Program, Vec3 } from "ogl";
import type { GLTF, OGLRenderingContext, Transform } from "ogl";
import fragment from "./shader.frag.glsl";
import vertex from "./shader.vert.glsl";

export function createBasicProgram(gl: OGLRenderingContext, material: any) {
  return new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      tDiffuse: { value: material.baseColorTexture.texture },
      tNormal: { value: material.normalTexture.texture },
      lightColor: { value: new Vec3(1, 1, 1) },
      lightDirection: { value: new Vec3(0, 1, 0) },
      uNormalScale: { value: 1 },
      uNormalUVScale: { value: 1 },
    },
  });
}

export function addBasic(
  gl: OGLRenderingContext,
  model: GLTF,
  scene: Transform
) {
  scene.children.forEach((child) => child.setParent(null));

  const s = model.scene || model.scenes[0];
  s.forEach((root) => {
    root.setParent(scene);
    root.traverse((node) => {
      if (node instanceof Mesh && node?.program) {
        const material = node.program.gltfMaterial || {};

        node.program = createBasicProgram(gl, material);
      }
    });
  });

  scene.updateMatrixWorld();
}
