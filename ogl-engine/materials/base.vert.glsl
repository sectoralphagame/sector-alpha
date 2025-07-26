#version 300 es
precision highp float;

in vec2 uv;
in vec3 position;

out vec2 vUv;
out float vFragDepth;
out vec3 worldPosition;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

void main() {
    vec4 mPosition = modelMatrix * vec4(position, 1.0f);
    worldPosition = mPosition.xyz;

    vUv = uv;

    gl_Position = projectionMatrix * viewMatrix * mPosition;
    vFragDepth = 1.f + gl_Position.w;
}
