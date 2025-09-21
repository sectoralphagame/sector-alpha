import { BaseMesh } from "@ogl-engine/engine/BaseMesh";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { Material } from "@ogl-engine/materials/material";
import { Geometry, Program, Vec3 } from "ogl";

const vertex = /* glsl */ `#version 300 es
precision highp float;

in vec3 position;
in vec3 color;

out vec3 vColor;
out float vFragDepth;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;


void main() {    
    vColor = color;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vFragDepth = 1.f + gl_Position.w;
}
`;

const fragment = /* glsl */ `#version 300 es
precision highp float;

in vec3 vColor;
in float vFragDepth;

out vec4 fragData[2];

uniform float uCameraScale;

void main() {    
    fragData[0] = vec4(vColor, 1.0);
    gl_FragDepth = log2(vFragDepth) / uCameraScale;
}
`;

class AxesHelperMaterial extends Material {
  constructor(engine: Engine3D) {
    super(engine);
    this.createProgram(vertex, fragment, {}, {});
  }
}

export class AxesHelper extends BaseMesh {
  constructor(
    engine: Engine3D,
    {
      size = 1,
      symmetric = false,
      xColor = new Vec3(0.96, 0.21, 0.32),
      yColor = new Vec3(0.44, 0.64, 0.11),
      zColor = new Vec3(0.18, 0.52, 0.89),
      ...meshProps
    } = {}
  ) {
    const a = symmetric ? -size : 0;
    const b = size;

    // prettier-ignore
    const vertices = new Float32Array([
			a, 0, 0,  b, 0, 0,
			0, a, 0,  0, b, 0,
			0, 0, a,  0, 0, b
		]);

    // prettier-ignore
    const colors = new Float32Array([
			...xColor,  ...xColor,
			...yColor,  ...yColor,
			...zColor,  ...zColor
		]);

    const geometry = new Geometry(engine.gl, {
      position: { size: 3, data: vertices },
      color: { size: 3, data: colors },
    });

    const program = new Program(engine.gl, { vertex, fragment });

    super(engine, {
      ...meshProps,
      mode: engine.gl.LINES,
      geometry,
      program,
      material: new AxesHelperMaterial(engine),
      calculateTangents: false,
    });
  }
}
