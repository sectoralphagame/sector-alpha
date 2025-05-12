#version 300 es
precision highp float;

in vec3 position;
in vec2 uv;

out vec2 vUv;
out vec3 vPosition;

uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPosition;

void main() {
    vUv = uv;
    vec3 p = position;
    vPosition = (modelMatrix * vec4(p, 1.0f)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0f);
}