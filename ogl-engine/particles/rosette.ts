import type { OGLRenderingContext } from "ogl";
import { Geometry } from "ogl";

// Creates two intersecting planes
export class RosetteGeometry extends Geometry {
  constructor(gl: OGLRenderingContext) {
    super(gl, {
      position: {
        size: 3,
        data: new Float32Array([
          -0.5, 0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0,

          0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, -0.5, 0.5,

          //   -0.5, 0, 0.5, 0.5, 0, 0.5, -0.5, 0, -0.5, 0.5, 0, -0.5,
        ]),
      },
      normal: {
        size: 3,
        data: new Float32Array([
          0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,

          1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,

          //   0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
        ]),
      },
      uv: {
        size: 2,
        data: new Float32Array([
          0, 1, 1, 1, 0, 0, 1, 0,

          0, 1, 1, 1, 0, 0, 1, 0,

          //   0, 1, 1, 1, 0, 0, 1, 0,
        ]),
      },
      index: {
        data: new Uint16Array([
          0, 2, 1, 2, 3, 1,

          4, 6, 5, 6, 7, 5,

          //   8, 10, 9, 10, 11, 9,
        ]),
      },
    });
  }
}
