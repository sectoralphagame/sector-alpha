#version 300 es
precision highp float;

in vec3 position;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

out vec3 vDir;
out float vFragDepth;

void main() {
    mat4 viewNoTranslation = mat4(mat3(modelViewMatrix));
    vDir = normalize(position);

    gl_Position = projectionMatrix * viewNoTranslation * vec4(position, 1.0f);
    vFragDepth = 1.f + gl_Position.w;
}