#version 300 es
precision highp float;

in vec3 position;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

out vec3 vDir;

void main() {
    vDir = normalize(position);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0f);
}