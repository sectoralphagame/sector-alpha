#version 300 es
precision highp float;

#pragma defines

in vec2 uv;
in vec3 position;
in float t;
in mat4 instanceMatrix;

out vec2 vUv;
out float vT;
out float vFragDepth;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

void main() {
    vUv = uv;
    vT = t;

    vec4 worldPosition = instanceMatrix * vec4(position, 1.0f);
    #ifdef USE_MODEL_MATRIX
    vec4 worldPosition = modelMatrix * worldPosition;
    #endif

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
    vFragDepth = 1.f + gl_Position.w;
}