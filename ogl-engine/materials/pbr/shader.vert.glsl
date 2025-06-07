#version 300 es
precision highp float;

#pragma defines

#pragma glslify: getTBN = require("./ogl-engine/shader/tbn");

in vec2 uv;
in vec3 position;
in vec3 normal;
in vec3 tangent;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform float uTime;

out vec2 vUv;
out vec3 vNormal;
out vec3 vTangent;
out vec3 worldPosition;
out mat3 tbn;

void main() {
    vec4 mPosition = modelMatrix * vec4(position, 1.0f);
    worldPosition = mPosition.xyz;

    vUv = uv;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vTangent = normalize(mat3(modelMatrix) * tangent);
    tbn = getTBN(vNormal, vTangent);

    gl_Position = projectionMatrix * viewMatrix * mPosition;
}
