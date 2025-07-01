#version 300 es
precision highp float;

#pragma glslify: billboard = require("./ogl-engine/shader/billboard")

in vec3 position;
in vec3 normal;
in vec2 uv;

out vec2 vUv;
out float vFragDepth;
out vec3 vWorldNormal;
out vec3 worldPosition;
out vec3 vNormal;

uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

void main() {
    vUv = uv;
    vNormal = normal;
    vec4 wPos = modelMatrix * vec4(position, 1.0f);
    worldPosition = wPos.xyz;
    mat3 normalMatrix = transpose(inverse(mat3(modelMatrix)));
    vWorldNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * viewMatrix * wPos;
    vFragDepth = 1.0f + gl_Position.w;
}