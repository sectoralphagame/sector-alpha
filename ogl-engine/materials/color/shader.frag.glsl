#version 300 es
precision highp float;

out vec4 fragData[2];

uniform vec3 uColor;
uniform float fEmissive;

void main() {
    fragData[0] = vec4(uColor / 255.f, 0.f);
    fragData[1] = fragData[0] * fEmissive;
}