#version 300 es
precision highp float;

#pragma defines

#pragma glslify: getTBN = require("./ogl-engine/shader/tbn");

in vec3 position;
in vec2 uv;
in vec3 normal;
in vec3 tangent;

in mat4 instanceMatrix;
in mat3 instanceNormalMatrix;

out vec3 worldPosition;
out vec2 vUv;
out vec3 vNormal;
out vec3 vTangent;
out mat3 tbn;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

void main() {
    vec4 mPosition = modelMatrix * instanceMatrix * vec4(position, 1.0f);
    worldPosition = mPosition.xyz;

    vNormal = normalize(instanceNormalMatrix * normal);
    vTangent = normalize(instanceNormalMatrix * tangent);
    tbn = getTBN(vNormal, vTangent);
    vUv = uv;

    gl_Position = projectionMatrix * viewMatrix * mPosition;
}
