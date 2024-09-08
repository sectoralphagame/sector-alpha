import type { GLTF, OGLRenderingContext, Transform } from "ogl";
import { Vec3 } from "ogl";
import { createProgram } from "./program";

export function addGLTF(
  gl: OGLRenderingContext,
  model: GLTF,
  scene: Transform
) {
  scene.children.forEach((child) => child.setParent(null));

  const s = model.scene || model.scenes[0];
  s.forEach((root) => {
    root.setParent(scene);
    root.traverse((node) => {
      if (node?.program) {
        node.program = createProgram(gl, node);
      }
    });
  });

  // Calculate world matrices for bounds
  scene.updateMatrixWorld();

  // Calculate rough world bounds to update camera
  const min = new Vec3(+Infinity);
  const max = new Vec3(-Infinity);
  const center = new Vec3();
  const scale = new Vec3();

  const boundsMin = new Vec3();
  const boundsMax = new Vec3();
  const boundsCenter = new Vec3();
  const boundsScale = new Vec3();

  model.meshes.forEach((group) => {
    group.primitives.forEach((mesh) => {
      if (!mesh.parent) return;

      if (!mesh.geometry.bounds) mesh.geometry.computeBoundingSphere();

      boundsCenter
        .copy(mesh.geometry.bounds.center)
        .applyMatrix4(mesh.worldMatrix);

      // Get max world scale axis
      mesh.worldMatrix.getScaling(boundsScale);
      const radiusScale = Math.max(
        Math.max(boundsScale[0], boundsScale[1]),
        boundsScale[2]
      );
      const radius = mesh.geometry.bounds.radius * radiusScale;

      boundsMin.set(-radius).add(boundsCenter);
      boundsMax.set(+radius).add(boundsCenter);

      // Apply world matrix to bounds
      for (let i = 0; i < 3; i++) {
        min[i] = Math.min(min[i], boundsMin[i]);
        max[i] = Math.max(max[i], boundsMax[i]);
      }
    });
  });
  scale.sub(max, min);
  center.add(min, max).divide(2);
}
