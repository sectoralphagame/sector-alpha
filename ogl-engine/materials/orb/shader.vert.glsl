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

    // vec3 offset = instanceMatrix[3].xyz;
    // vec3 scale = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));

    // vec4 worldPosition = vec4(billboard(position * scale, viewMatrix) + offset, 1.f);

    vec4 worldPosition = instanceMatrix * vec4(position, 1.0f);
    #ifdef USE_MODEL_MATRIX
    vec4 worldPosition = modelMatrix * worldPosition;
    #endif

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}