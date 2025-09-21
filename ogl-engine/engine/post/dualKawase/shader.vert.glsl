#version 300 es
precision highp float;

in vec2 uv;
in vec2 position;

out vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.f, 1.f);
}