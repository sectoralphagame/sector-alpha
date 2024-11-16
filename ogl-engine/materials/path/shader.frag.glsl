#version 300 es
precision highp float;

out vec4 fragData[2];

uniform vec3 uColor;

void main() {
    fragData[0] = vec4(uColor / 255.f, 0.f);
    fragData[1] = fragData[0] * 0.1f;
}