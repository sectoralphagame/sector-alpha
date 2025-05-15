#version 300 es
precision highp float;

#pragma defines

#pragma glslify: billboard = require("./ogl-engine/shader/billboard")

in vec2 uv;
in vec3 position;
in float t;
in mat4 instanceMatrix;

out vec2 vUv;
out float vT;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

void main() {
    vUv = uv;
    vT = t;

    gl_Position = projectionMatrix * viewMatrix * instanceMatrix * vec4(position, 1.0f);
}