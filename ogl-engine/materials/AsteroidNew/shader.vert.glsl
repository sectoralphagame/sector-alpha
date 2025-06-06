#version 300 es
precision highp float;

#pragma defines

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

void main() {
    #ifdef USE_INSTANCING
    vec4 mPosition = modelMatrix * instanceMatrix * vec4(position, 1.0f);

    vNormal = normalize(instanceNormalMatrix * normal);
    vTangent = normalize(instanceNormalMatrix * tangent);
    #else
    vec4 mPosition = modelMatrix * vec4(position, 1.0f);

    vTangent = mat3(modelMatrix) * tangent;
    vNormal = mat3(modelMatrix) * normal;
    #endif

    vUv = uv;

    worldPosition = mPosition.xyz;

    gl_Position = projectionMatrix * viewMatrix * mPosition;
}