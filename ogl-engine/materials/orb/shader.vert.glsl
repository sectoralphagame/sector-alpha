#version 300 es
precision highp float;

in vec2 uv;
in vec3 position;

out vec2 vUv;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

void main() {
    vec4 mPosition = modelMatrix * vec4(position, 1.0f);
    vec4 mvPosition = viewMatrix * mPosition;

    vUv = uv;

    gl_Position = projectionMatrix * mvPosition;
}