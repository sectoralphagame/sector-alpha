#version 300 es
precision highp float;

out vec4 fragData[2];

#define color vec4(169., 207., 252., 255.) / 255.

void main() {
    fragData[0] = color;
    fragData[1] = fragData[0] * 0.1f;
}