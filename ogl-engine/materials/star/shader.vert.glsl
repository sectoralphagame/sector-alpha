#version 300 es
precision highp float;

in vec3 position;
in vec3 normal;
in vec2 uv;

out vec3 vPosition;
out vec3 vWorldNormal;
out vec3 vViewDirection;
out vec2 vUv;
out float vFragDepth;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPosition;

void main() {
    vPosition = normalize(position);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0f);
    vWorldNormal = normalize(modelMatrix * vec4(normal, 0.0f)).xyz;
    vViewDirection = normalize(cameraPosition - worldPosition.xyz);
    vUv = uv;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0f);
    vFragDepth = 1.0f + gl_Position.w;
}
