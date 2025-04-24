#version 300 es
precision highp float;

#pragma glslify: billboard = require("./ogl-engine/shader/billboard")

in vec3 position;
in vec2 uv;
in vec3 offset;
in vec3 scale;
in float instanceIndex;

out vec2 vUv;
flat out float vInstanceIndex;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

void main() {
    float ii = mod(instanceIndex, 16.f);
    float x = floor(ii / 4.f);
    float y = ii - x * 4.f;

    vUv = vec2(uv.x + x, uv.y + y) / 4.f;
    vInstanceIndex = instanceIndex;

    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(billboard(position * scale, viewMatrix) + offset, 1.f);
}