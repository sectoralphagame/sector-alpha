#version 300 es
precision highp float;

#pragma defines

#pragma glslify: getTBN = require("./ogl-engine/shader/tbn");

in vec2 uv;
in vec3 position;
in vec3 normal;
in vec3 tangent;

#ifdef USE_INSTANCING
in mat4 instanceMatrix;
in mat3 instanceNormalMatrix;
#endif

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
    #ifdef USE_INSTANCING
    vec4 mPosition = modelMatrix * instanceMatrix * vec4(position, 1.0f);

    vNormal = instanceNormalMatrix * normal;
    vTangent = instanceNormalMatrix * tangent;
    #else
    vec4 mPosition = modelMatrix * vec4(position, 1.0f);

    vNormal = mat3(modelMatrix) * normal;
    vTangent = mat3(modelMatrix) * tangent;
    #endif

    vNormal = normalize(vNormal);
    vTangent = normalize(vTangent);

    tbn = getTBN(vNormal, vTangent);
    vUv = uv;
    worldPosition = mPosition.xyz;

    gl_Position = projectionMatrix * viewMatrix * mPosition;
}