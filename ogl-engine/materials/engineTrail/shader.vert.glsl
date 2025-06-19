#version 300 es
precision highp float;

in vec3 position;
in vec2 uv;

out vec2 vUv;
out float vFragDepth;

uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0f);
    vFragDepth = 1.0f + gl_Position.w;
}