#version 300 es
precision highp float;

#pragma glslify: tbn = require("./ogl-engine/shader/tbn");

in vec2 uv;
in vec3 position;
in vec3 normal;
in vec3 tangent;

uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform float uTime;

out vec2 vUv;
out vec3 vNormal;
out vec3 worldPosition;
out mat3 vTBN;

void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0f);
    worldPosition = mvPosition.xyz;

    vUv = uv;
    vTBN = tbn(modelViewMatrix, normalMatrix, tangent, normal);
    vNormal = normal;

    gl_Position = projectionMatrix * mvPosition;
}
