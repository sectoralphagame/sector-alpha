#version 300 es
precision highp float;

in vec3 position;
in vec2 uv;

out vec2 vUv;
out float fDist;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
uniform vec3 cameraPosition;

void main() {
    vUv = uv;
    fDist = distance((modelMatrix * vec4(position, 1.0f)).xyz, cameraPosition);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0f);
}