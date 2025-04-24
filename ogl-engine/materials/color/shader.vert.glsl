#version 300 es
precision highp float;

in vec2 uv;
in vec3 position;
in vec3 normal;

out vec3 vNormal;
out vec3 worldPosition;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

void main() {
    vec4 mPosition = modelMatrix * vec4(position, 1.0f);
    worldPosition = mPosition.xyz;

    vNormal = mat3(modelMatrix) * normal;

    gl_Position = projectionMatrix * viewMatrix * mPosition;
}