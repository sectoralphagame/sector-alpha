#version 300 es
precision highp float;

in vec2 uv;
in vec3 position;
in vec3 normal;

out vec2 vUv;
out float vFragDepth;
out vec3 worldPosition;
out vec3 vNormal;
out vec3 vViewDirection;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPosition;

void main() {
    vec4 mPosition = modelMatrix * vec4(position, 1.0f);
    worldPosition = mPosition.xyz;

    vUv = uv;
    vNormal = normalize(modelMatrix * vec4(normal, 0.0f)).xyz;
    vViewDirection = normalize(cameraPosition - worldPosition.xyz);

    gl_Position = projectionMatrix * viewMatrix * mPosition;
    vFragDepth = 1.f + gl_Position.w;
}
