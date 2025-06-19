#version 300 es
precision highp float;

#pragma glslify: snoise4 = require(glsl-noise/simplex/4d)

in vec3 position;
in vec3 normal;
in vec2 uv;

out vec3 vPosition;
out vec3 vWorldNormal;
out vec3 vViewDirection;
out vec2 vUv;
out float vFragDepth;

uniform float uTime;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPosition;

void main() {
    vPosition = normalize(position);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0f);
    vWorldNormal = normalize(modelMatrix * vec4(normal, 0.0f)).xyz;
    vViewDirection = normalize(cameraPosition - worldPosition.xyz);
    vUv = uv;

    float noise = snoise4(vec4(vPosition, uTime * 0.2f));

    vec3 displacement = vPosition * noise * 0.08f;

    mat4 trs = modelMatrix;
    trs[3][0] += cameraPosition.x;
    trs[3][1] += cameraPosition.y;
    trs[3][2] += cameraPosition.z;

    // Standard position transformation for vertex shader
    gl_Position = projectionMatrix * viewMatrix * trs * vec4(position, 1.0f) + vec4(displacement, 1.0f);
    vFragDepth = 1.0f + gl_Position.w;
}
