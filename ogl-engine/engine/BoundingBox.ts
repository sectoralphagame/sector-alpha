import type { Bounds, OGLRenderingContext } from "ogl";
import { Box, Mesh, Program } from "ogl";

export class BoundingBox extends Mesh {
  name = "BoundingBox";

  constructor(gl: OGLRenderingContext, bounds: Bounds) {
    super(gl, {
      geometry: new Box(gl, {
        width: bounds.scale.x,
        height: bounds.scale.y,
        depth: bounds.scale.z,
      }),
      program: new Program(gl, {
        vertex: `#version 300 es
                precision highp float;
      
                in vec3 position;
      
                uniform mat4 modelViewMatrix;
                uniform mat4 projectionMatrix;
      
                void main() {
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0f);
                }
              `,
        fragment: `#version 300 es
                precision highp float;
      
                out vec4 fragColor;
      
                void main() {
                    fragColor = vec4(0.0, 1.0, 0.0, 1.0);
                }
              `,
      }),
      mode: gl.LINES,
    });
    this.position.add(bounds.center);
  }
}
