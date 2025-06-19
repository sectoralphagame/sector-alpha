#version 300 es
precision highp float;

#pragma glslify: billboard = require("./ogl-engine/shader/billboard")
#pragma glslify: spritesheetUv = require("./ogl-engine/shader/spritesheetUv")

in vec3 position;
in vec2 uv;
in mat4 instanceMatrix;
in float instanceIndex;
in float t;

out vec2 vUv;
out float vFragDepth;
flat out float vInstanceIndex;
flat out float vT;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

void main() {
    vUv = spritesheetUv(uv, instanceIndex, 4.f);
    vInstanceIndex = instanceIndex;
    vT = t;

    vec3 offset = instanceMatrix[3].xyz;
    vec3 scale = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));

    vec4 worldPosition = vec4(billboard(position * scale, viewMatrix) + offset, 1.f);

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
    vFragDepth = 1.f + gl_Position.w;
}