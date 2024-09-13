import { Program, Vec3 } from "ogl";
import type { GLTF, OGLRenderingContext, Transform } from "ogl";
import fragmentShader from "./shader.frag.glsl";
import vertexShader from "./shader.vert.glsl";

export function addBasic(
  gl: OGLRenderingContext,
  model: GLTF,
  scene: Transform,
  instanced: boolean
) {
  scene.children.forEach((child) => child.setParent(null));

  const s = model.scene || model.scenes[0];
  s.forEach((root) => {
    root.setParent(scene);
    root.traverse((node) => {
      if (node?.program) {
        const material = node.program.gltfMaterial || {};

        const vertex = instanced
          ? [
              vertexShader.split("\n")[0],
              "#define instanced",
              ...vertexShader.split("\n").slice(1),
            ].join("\n")
          : vertexShader;
        const fragment = instanced
          ? [
              fragmentShader.split("\n")[0],
              "#define instanced",
              ...fragmentShader.split("\n").slice(1),
            ].join("\n")
          : fragmentShader;

        node.program = new Program(gl, {
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
    });
  });

  scene.updateMatrixWorld();
}
