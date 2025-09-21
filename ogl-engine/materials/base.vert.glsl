#version 300 es
precision highp float;

#pragma defines

in vec2 uv;
in vec3 position;
in vec3 normal;

#ifdef USE_INSTANCING
in mat4 instanceMatrix;
in mat3 instanceNormalMatrix;
in float instanceIndex;
#endif

out vec2 vUv;
out float vFragDepth;
out vec3 worldPosition;
out vec3 vNormal;
out vec3 vViewDirection;

#ifdef USE_INSTANCING
out flat float vInstanceIndex;
#endif

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPosition;

void main() {
    #ifdef USE_INSTANCING
    mat4 toWorldPosition = modelMatrix * instanceMatrix;
    vInstanceIndex = instanceIndex;
    #else
    mat4 toWorldPosition = modelMatrix;
    #endif
    vec4 wPosition = toWorldPosition * vec4(position, 1.0f);
    worldPosition = wPosition.xyz;

    vUv = uv;
    vNormal = normalize(toWorldPosition * vec4(normal, 0.0f)).xyz;
    vViewDirection = normalize(cameraPosition - worldPosition.xyz);

    gl_Position = projectionMatrix * viewMatrix * wPosition;
    vFragDepth = 1.f + gl_Position.w;
}
