import type { OGLRenderingContext } from "ogl";
import { Geometry } from "ogl";

export class CrossGeometry extends Geometry {
  constructor(gl: OGLRenderingContext) {
    super(gl, {
      index: {
        size: 1,
        data: new Uint16Array([
          0,
          2,
          1,
          2,
          3,
          1, // First plane
          4,
          6,
          5,
          6,
          7,
          5, // Second plane
        ]),
      },
      position: {
        size: 3,
        data: new Float32Array([
          // First Plane (XY)
          -0.5,
          0.5,
          0.0, // 0
          0.5,
          0.5,
          0.0, // 1
          -0.5,
          -0.5,
          0.0, // 2
          0.5,
          -0.5,
          0.0, // 3

          // Second Plane (XZ) - Interlocking
          0.0,
          -0.5,
          -0.5, // 4
          0.0,
          0.5,
          -0.5, // 5
          0.0,
          -0.5,
          0.5, // 6
          0.0,
          0.5,
          0.5, // 7
        ]),
      },
      uv: {
        size: 2,
        data: new Float32Array([
          // First Plane UVs
          0, 1, 1, 1, 0, 0, 1, 0,
          // Second Plane UVs
          0, 1, 1, 1, 0, 0, 1, 0,
        ]),
      },
      normal: {
        size: 3,
        data: new Float32Array([
          // First Plane normals (facing +Z)
          0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
          // Second Plane normals (facing +X)
          1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
        ]),
      },
    });
  }
}
